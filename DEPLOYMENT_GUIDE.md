# UniAxis Technologies - Digital Ocean Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Remove Old Website](#remove-old-website)
3. [Setup New Website](#setup-new-website)
4. [Configure SSL Certificate](#configure-ssl-certificate)
5. [Setup Nginx](#setup-nginx)
6. [Setup Systemd Service](#setup-systemd-service)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required:
- Digital Ocean Droplet (Ubuntu 20.04 LTS or newer) 
- Root or sudo access
- Domain name pointing to your droplet IP
- SSH access to your droplet

### Check Your Setup:
```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Check Ubuntu version
lsb_release -a

# Check Node.js (install if needed)
node --version
npm --version
```

If Node.js is not installed:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## Step 1: Remove Old Website

### 1.1 Stop the Old Service
```bash
# Bring down Nginx (if running)
sudo systemctl stop nginx

# Stop any Node.js processes
sudo pkill -f "node"

# Or specifically:
sudo systemctl stop uniaxis

# Verify it's stopped
ps aux | grep node
```

### 1.2 Backup Old Website (Important!)
```bash
# Create backup directory
sudo mkdir -p /backups
sudo cp -r /var/www/html /backups/old_website_backup_$(date +%Y%m%d_%H%M%S)

# Compress backup (optional, saves space)
sudo tar -czf /backups/old_website_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/html

# List backups
ls -lah /backups/
```

### 1.3 Remove Old Files
```bash
# Remove old website files
sudo rm -rf /var/www/html/*

# Clear npm cache (optional)
npm cache clean --force
```

### 1.4 Remove Old SSL Certificates (if using Let's Encrypt)
```bash
# Stop Certbot if running
sudo systemctl stop certbot.timer

# Remove old certificate
sudo rm -rf /etc/letsencrypt/live/your-domain.com
sudo rm -rf /etc/letsencrypt/archive/your-domain.com

# List remaining certificates
sudo ls -la /etc/letsencrypt/live/
```

---

## Step 2: Setup New Website

### 2.1 Clone/Upload Repository
```bash
# Navigate to web root
cd /var/www

# Option A: Clone from GitHub
sudo git clone https://github.com/adirane45/UniAxis.git html
cd html

# Option B: Upload files manually
# Use SCP or SFTP to upload your files
# scp -r LocalPath/* root@your_ip:/var/www/html/
```

### 2.2 Set Proper Permissions
```bash
# Change ownership to www-data user
sudo chown -R www-data:www-data /var/www/html

# Set proper permissions
sudo chmod -R 755 /var/www/html
sudo chmod -R 644 /var/www/html/*

# For folders and executable files
sudo find /var/www/html -type d -exec chmod 755 {} \;
sudo find /var/www/html -type f -exec chmod 644 {} \;
```

### 2.3 Install Dependencies
```bash
cd /var/www/html

# Install Node packages
npm install

# Install production dependencies only (removes dev dependencies)
npm install --production

# Verify installation
npm list
```

### 2.4 Create Environment File
```bash
# Copy the example file
cp .env.example .env

# Edit the file with your actual values
sudo nano .env
```

**Edit these values in .env:**
```
NODE_ENV=production
PORT=3000
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
CONTACT_EMAIL=info@uniaxis.tech
SENDER_EMAIL=noreply@uniaxis.tech
```

### 2.5 Test the Application
```bash
# Start the app (should run on port 3000)
npm start

# In another terminal, test it
curl http://localhost:3000

# Press Ctrl+C to stop
```

---

## Step 3: Configure SSL Certificate

### 3.1 Install Certbot
```bash
# Install Certbot for Let's Encrypt
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### 3.2 Generate SSL Certificate
```bash
# Generate certificate (replace with your domain)
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com --non-interactive --agree-tos -m admin@your-domain.com

# Verify certificate
sudo ls -la /etc/letsencrypt/live/your-domain.com/
```

### 3.3 Setup Auto-Renewal
```bash
# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run

# Check renewal status
sudo systemctl status certbot.timer
```

---

## Step 4: Setup Nginx

### 4.1 Install Nginx
```bash
# Install Nginx
sudo apt-get install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### 4.2 Configure Nginx
```bash
# Remove default configuration
sudo rm /etc/nginx/sites-available/default
sudo rm /etc/nginx/sites-enabled/default

# Create new configuration
sudo nano /etc/nginx/sites-available/uniaxis
```

Paste this configuration (modify domain name):

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;
    
    # Root directory
    root /var/www/html/public;
    index index.html;
    
    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # SPA Fallback - Route all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Deny access to dot files and sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ ~$ {
        deny all;
    }
}

# Redirect www to non-www (optional)
# Remove this block if you prefer www.your-domain.com
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    return 301 https://your-domain.com$request_uri;
}
```

### 4.3 Enable Configuration
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/uniaxis /etc/nginx/sites-enabled/uniaxis

# Test configuration
sudo nginx -t

# Should show:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 4.4 Reload Nginx
```bash
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# View logs if there are errors
sudo tail -f /var/log/nginx/error.log
```

---

## Step 5: Setup Systemd Service

### 5.1 Create Service File
```bash
sudo nano /etc/systemd/system/uniaxis.service
```

Paste this configuration:

```ini
[Unit]
Description=UniAxis Technologies Website
After=network.target
After=syslog.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/html
Environment="NODE_ENV=production"
EnvironmentFile=/var/www/html/.env

ExecStart=/usr/bin/node server.js

# Restart service on crash
Restart=on-failure
RestartSec=10

# Process management
KillMode=process
KillSignal=SIGTERM

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

### 5.2 Enable and Start Service
```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable uniaxis

# Start service
sudo systemctl start uniaxis

# Check status
sudo systemctl status uniaxis

# View logs
sudo journalctl -u uniaxis -f
```

### 5.3 Verify Service is Running
```bash
# Check if port 3000 is listening
sudo lsof -i :3000

# curl should return the website
curl http://localhost:3000

# Check service logs
sudo systemctl status uniaxis
```

---

## Step 6: Final Configuration & Testing

### 6.1 Update DNS
```bash
# Point your domain to your droplet IP
# In your domain registrar/DNS provider:
# A record: your-domain.com → droplet_ip
# CNAME record: www.your-domain.com → your-domain.com

# Verify DNS resolution
nslookup your-domain.com
dig your-domain.com
```

### 6.2 Test in Browser
```bash
# After DNS propagates (5-30 minutes):
# Visit https://your-domain.com in your browser
```

### 6.3 Test API Endpoints
```bash
# Test contact form
curl -X POST https://your-domain.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Subject",
    "message": "This is a test message"
  }'

# Test health endpoint
curl https://your-domain.com/api/health
```

---

## Step 7: Monitoring & Maintenance

### 7.1 Check Logs
```bash
# Nginx error logs
sudo tail -50 /var/log/nginx/error.log

# Nginx access logs
sudo tail -50 /var/log/nginx/access.log

# Application logs
sudo journalctl -u uniaxis -n 50

# Real-time logs
sudo journalctl -u uniaxis -f
```

### 7.2 Monitor Service Health
```bash
# Check service status
sudo systemctl status uniaxis

# Check if process exists
ps aux | grep node

# Check memory usage
free -h

# Check disk usage
df -h

# Check CPU usage
top
```

### 7.3 Regular Maintenance
```bash
# Update system packages (monthly)
sudo apt-get update
sudo apt-get upgrade -y

# Update Node packages
cd /var/www/html
npm update

# Clear npm cache periodically
npm cache clean --force

# Backup database/files
# Create your backup script
sudo crontab -e
```

### 7.4 Setup Automated Backups
```bash
# Create backup script
sudo nano /usr/local/bin/backup-uniaxis.sh
```

Paste this:

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
echo "Starting backup at $(date)"
tar -czf $BACKUP_DIR/uniaxis_$DATE.tar.gz /var/www/html
echo "Backup completed at $(date)"
# Keep only last 7 days of backups
find $BACKUP_DIR -name "uniaxis_*.tar.gz" -mtime +7 -delete
```

Make executable and add to cron:
```bash
sudo chmod +x /usr/local/bin/backup-uniaxis.sh
sudo crontab -e

# Add this line (backup daily at 2 AM):
# 0 2 * * * /usr/local/bin/backup-uniaxis.sh
```

---

## Step 8: Performance Optimization

### 8.1 Enable Caching
```bash
# The Nginx config already includes:
# - Gzip compression
# - Static file caching (30 days)
# - SSL session caching
```

### 8.2 Monitor Performance
```bash
# Check response times
curl -I https://your-domain.com

# Use online tools:
# - Google PageSpeed Insights
# - GTmetrix
# - Lighthouse
```

### 8.3 Enable HTTP/2
```bash
# Already enabled in Nginx config
# Verify with:
curl -I --http2 https://your-domain.com
```

---

## Troubleshooting

### Issue: Service Won't Start
```bash
# Check logs
sudo journalctl -u uniaxis -n 20

# Check syntax
node -c /var/www/html/server.js

# Check permission
ls -la /var/www/html
sudo chown -R www-data:www-data /var/www/html
```

### Issue: 502 Bad Gateway
```bash
# Check if Node is running
sudo systemctl status uniaxis

# Restart service
sudo systemctl restart uniaxis

# Check logs
sudo journalctl -u uniaxis -f
```

### Issue: SSL Certificate Error
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check Nginx config
sudo nginx -t
```

### Issue: Host Connection Refused
```bash
# Check if service is listening on port 3000
sudo lsof -i :3000

# Check firewall (if UFW enabled)
sudo ufw status
sudo ufw allow from any to any port 3000

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: Emails Not Sending
```bash
# Check .env file
cats /var/www/html/.env | grep EMAIL

# Test email configuration
# In .env, ensure GMAIL_USER and GMAIL_PASS are correct
# For Gmail, use an App Password, not regular password

# Check mail logs
sudo journalctl -u uniaxis | grep -i mail
```

### Common Ports
```bash
# Check what's using ports
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000

# Kill process on port (if needed)
sudo kill -9 <PID>
```

---

## Useful Commands Reference

```bash
# Service Management
sudo systemctl start uniaxis
sudo systemctl stop uniaxis
sudo systemctl restart uniaxis
sudo systemctl status uniaxis
sudo systemctl enable uniaxis
sudo systemctl disable uniaxis

# Nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo nginx -t

# Logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
sudo journalctl -u uniaxis -f
sudo journalctl -u nginx -f

# SSL Certificate
sudo certbot certificates
sudo certbot renew
sudo certbot renew --dry-run

# System Info
df -h              # Disk space
free -h            # Memory
top                # Running processes
ps aux | grep node # Check Node processes
```

---

## Security Recommendations

1. **Enable UFW Firewall**
```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw status
```

2. **Keep System Updated**
```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get autoremove
```

3. **Setup SSH Security**
```bash
# Disable root login
# Change default SSH port
# Use SSH keys instead of passwords
# Edit /etc/ssh/sshd_config
```

4. **Regular Backups**
- Backup your website files
- Backup .env file (separately)
- Keep multiple versions

5. **Monitor Security**
```bash
# Check failed login attempts
sudo journalctl | grep Failed

# Check for suspicious activity
sudo tail -f /var/log/auth.log
```

---

## Support & Resources

- **Domain Management**: Update DNS at your registrar
- **Let's Encrypt**: https://letsencrypt.org/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Ubuntu Documentation**: https://ubuntu.com/server/docs
- **Node.js Documentation**: https://nodejs.org/en/docs/
- **Digital Ocean Droplet Docs**: https://docs.digitalocean.com/products/droplets/

---

## Summary

Your website is now:
✅ Live on your domain (HTTPS)
✅ Protected with SSL certificate
✅ Automatically restarts on failure
✅ Optimized with Nginx caching
✅ Configured for email notifications
✅ Ready for auto-certificate renewal

**Domain**: https://your-domain.com
**Contact Form**: Sends emails to your configured address
**API Health**: https://your-domain.com/api/health

---

## Quick Restart Guide

If you ever need to rebuild from scratch:

1. SSH into droplet: `ssh root@your_ip`
2. Stop old service: `sudo systemctl stop nginx uniaxis`
3. Clone new site: `sudo git clone URL /var/www/html`
4. Install deps: `cd /var/www/html && npm install`
5. Create .env: `cp .env.example .env && nano .env`
6. Fix permissions: `sudo chown -R www-data:www-data /var/www/html`
7. Start service: `sudo systemctl start uniaxis nginx`
8. Verify: `curl https://your-domain.com`

---

**Last Updated**: February 2026
**Version**: 1.0.0
**Status**: Production Ready
