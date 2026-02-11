#!/bin/bash
set -e

echo "================================"
echo "Setting up EC2 for deployment..."
echo "================================"

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install nginx
sudo apt-get install -y nginx

# Install git
sudo apt-get install -y git

# Create app directory
APP_DIR="/home/ubuntu/local-service-booking"
if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    git clone https://github.com/chdeepak/local-service-booking.git .
else
    cd "$APP_DIR"
    git pull origin main
fi

# Install dependencies
npm ci --omit=dev

# Build the application
npm run build

# Configure environment file
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set"
    exit 1
fi

sudo mkdir -p /etc/local-service-booking
echo "DATABASE_URL=$DATABASE_URL" | sudo tee /etc/local-service-booking/.env > /dev/null
sudo chmod 600 /etc/local-service-booking/.env

# Copy systemd service file
sudo cp "$APP_DIR/scripts/local-service-booking.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable local-service-booking
sudo systemctl start local-service-booking

# Configure nginx
sudo cp "$APP_DIR/scripts/nginx-config.conf" /etc/nginx/sites-available/local-service-booking
sudo ln -sf /etc/nginx/sites-available/local-service-booking /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Allow nginx through firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow 22/tcp

echo "================================"
echo "Setup completed successfully!"
echo "================================"
echo ""
echo "Application status:"
sudo systemctl status local-service-booking
echo ""
echo "Nginx is running and forwarding requests to port 3000"
echo "Access your app at: http://$(hostname -I)"
