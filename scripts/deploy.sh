#!/bin/bash
set -e

echo "=========================================="
echo "Step 1: Initial Setup"
echo "=========================================="

# Install Node.js
if ! command -v node &> /dev/null; then
  echo "⚠ Node.js not found - installing..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  echo "✓ Node.js installed: $(node --version)"
else
  echo "✓ Node.js: $(node --version)"
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
  echo "⚠ Nginx not found - installing..."
  sudo apt-get update
  sudo apt-get install -y nginx
  echo "✓ Nginx installed"
else
  echo "✓ Nginx already installed"
fi

# Install Git
if ! command -v git &> /dev/null; then
  echo "⚠ Git not found - installing..."
  sudo apt-get install -y git
  echo "✓ Git installed"
else
  echo "✓ Git already installed"
fi

echo ""
echo "=========================================="
echo "Step 2: Deploy Application"
echo "=========================================="

# Setup app directory
if [ ! -d ~/local-service-booking ]; then
  mkdir -p ~/local-service-booking
  cd ~/local-service-booking
  git clone https://github.com/chdeepak/local-service-booking.git .
else
  cd ~/local-service-booking
  git pull origin main || git fetch && git reset --hard origin/main
fi

echo "✓ Code synced"
echo "🔍 Node: $(node --version)"
echo "🔍 npm: $(npm --version)"

# Install and build
echo "📦 Installing dependencies..."
npm ci || npm install
echo "✓ Dependencies installed"

echo "🔨 Building..."
npm run build || { echo "❌ Build failed"; exit 1; }
echo "✓ Build OK"

echo "🧹 Cleaning up dev dependencies..."
npm prune --production || true

echo ""
echo "=========================================="
echo "Step 3: Configure Environment"
echo "=========================================="

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "📝 Creating environment file..."
sudo mkdir -p /etc/local-service-booking
echo "DATABASE_URL=$DATABASE_URL" | sudo tee /etc/local-service-booking/.env > /dev/null
sudo chmod 600 /etc/local-service-booking/.env
echo "DBURLS= $DATABASE_URL"
echo "✓ Environment configured"

echo ""
echo "=========================================="
echo "Step 4: Configure Systemd Service"
echo "=========================================="

echo "📋 Setting up systemd service..."
sudo cp ~/local-service-booking/scripts/local-service-booking.service /etc/systemd/system/local-service-booking.service
sudo systemctl daemon-reload
sudo systemctl enable local-service-booking
echo "✓ Service configured"

echo ""
echo "=========================================="
echo "Step 5: Configure Nginx"
echo "=========================================="

echo "🌐 Configuring Nginx..."
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
sudo cp ~/local-service-booking/scripts/nginx-config.conf /etc/nginx/sites-available/local-service-booking
sudo ln -sf /etc/nginx/sites-available/local-service-booking /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
echo "✓ Nginx configured"

echo "🔍 Testing Nginx..."
sudo nginx -t || { echo "❌ Nginx test failed"; exit 1; }

echo ""
echo "=========================================="
echo "Step 6: Start Services"
echo "=========================================="

echo "🔄 Restarting application..."
sudo systemctl restart local-service-booking
sleep 2
sudo systemctl status local-service-booking --no-pager || true

echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager || true

echo ""
echo "🧪 Testing endpoints..."
sleep 1
echo "Testing health endpoint..."
curl -s http://localhost/health || echo "⚠ Health endpoint not responding yet"

echo ""
echo "✅ Deployment successful!"
