#!/bin/bash

# UniAxis Technologies - Digital Ocean Deployment Script
# Run this script on a fresh Ubuntu 22.04 droplet as root

set -e

echo "=== UniAxis Technologies Deployment ==="
echo "This script will setup your website on Digital Ocean"

# Variables
DOMAIN="uniaxis.tech"
APP_DIR="/var/www/uniaxis"
APP_USER="www-data"
NODEJS_VERSION="18"

# Update system
echo "Step 1: Updating system..."
apt update && apt upgrade -y

# Install Node.js
echo "Step 2: Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_${NODEJS_VERSION}.x | sudo -E bash -
apt install -y nodejs

# Install global npm packages
echo "Step 3: Installing global packages..."
npm install -g pm2

# Install Nginx
echo "Step 4: Installing Nginx..."
apt install -y nginx

# Install Certbot
echo "Step 5: Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Create app directory
echo "Step 6: Setting up application directory..."
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# Clone repository (modify this with your repo)
echo "Step 7: Cloning repository..."
cd $APP_DIR
# git clone <your-repo-url> . OR upload files manually

# Install dependencies
echo "Step 8: Installing dependencies..."
cd $APP_DIR
npm install --production

# Copy Nginx config
echo "Step 9: Configuring Nginx..."
cp deployment/nginx.conf /etc/nginx/sites-available/$DOMAIN
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Test Nginx
nginx -t

# Setup SSL
echo "Step 10: Setting up SSL certificate..."
certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

# Reload Nginx
systemctl reload nginx

# Setup PM2
echo "Step 11: Starting application with PM2..."
pm2 start server.js --name "uniaxis"
pm2 startup -u $APP_USER
pm2 save

# Setup firewall
echo "Step 12: Setting up firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Enable services
echo "Step 13: Enabling services..."
systemctl enable nginx
systemctl enable pm2-$APP_USER

echo ""
echo "=== Deployment Complete ==="
echo "Your website is now live at https://$DOMAIN"
echo ""
echo "Next steps:"
echo "1. Update email addresses in server code"
echo "2. Configure DNS records pointing to this server"
echo "3. Monitor logs: pm2 logs"
echo "4. Check Nginx logs: tail -f /var/log/nginx/uniaxis_*.log"
echo ""
echo "SSL Auto-renewal: Enabled"
echo "Auto-restart on failure: Enabled"
