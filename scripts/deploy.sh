#!/bin/bash
set -e

echo "=========================================="
echo "Step 1: Initial Setup"
echo "=========================================="

# Detect OS
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
fi

echo "🔍 Detected OS: $OS"

# Install Node.js
if ! command -v node &> /dev/null; then
  echo "⚠ Node.js not found - installing..."
  if [ "$OS" = "amzn" ]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
  else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
  echo "✓ Node.js installed: $(node --version)"
else
  echo "✓ Node.js: $(node --version)"
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
  echo "⚠ Nginx not found - installing..."
  if [ "$OS" = "amzn" ]; then
    sudo yum install -y nginx
  else
    sudo apt-get update
    sudo apt-get install -y nginx
  fi
  echo "✓ Nginx installed"
else
  echo "✓ Nginx already installed"
fi

# Install Git
if ! command -v git &> /dev/null; then
  echo "⚠ Git not found - installing..."
  if [ "$OS" = "amzn" ]; then
    sudo yum install -y git
  else
    sudo apt-get install -y git
  fi
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
  git pull origin main
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
echo "Step 3: Configure Systemd Service"
echo "=========================================="

echo "📋 Setting up systemd service..."
sudo cp ~/local-service-booking/scripts/local-service-booking.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable local-service-booking
echo "✓ Service configured"

echo ""
echo "=========================================="
echo "Step 4: Configure Nginx"
echo "=========================================="

if [ "$OS" = "amzn" ]; then
  echo "🌐 Configuring Nginx for Amazon Linux..."
  sudo tee /etc/nginx/conf.d/local-service-booking.conf > /dev/null << 'EOF'
server {
  listen 80 default_server;
  server_name _;
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
  location /health {
    proxy_pass http://localhost:3000/health;
    access_log off;
  }
}
EOF
else
  echo "🌐 Configuring Nginx for Debian/Ubuntu..."
  sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
  sudo cp ~/local-service-booking/scripts/nginx-config.conf /etc/nginx/sites-available/local-service-booking
  sudo ln -sf /etc/nginx/sites-available/local-service-booking /etc/nginx/sites-enabled/
  sudo rm -f /etc/nginx/sites-enabled/default
fi

echo "✓ Nginx configured"

echo "🔍 Testing Nginx..."
sudo nginx -t || { echo "❌ Nginx test failed"; exit 1; }

echo ""
echo "=========================================="
echo "Step 5: Start Services"
echo "=========================================="

echo "🔄 Restarting application..."
sudo systemctl restart local-service-booking
sleep 2
sudo systemctl status local-service-booking --no-pager || true

echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager || true

echo ""
echo "✅ Deployment successful!"
