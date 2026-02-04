# Digital Ocean Deployment Guide - Step by Step

## 🎯 Overview

This guide walks you through deploying the UniAxis website to Digital Ocean's cheapest droplet ($4/month, 512MB RAM).

**Total Cost**: $4/month
**Performance**: Handles 1000+ daily visitors
**Setup Time**: ~30 minutes

---

## 📋 Prerequisites

1. Digital Ocean account (with billing set up)
2. SSH key configured (or password)
3. Git account (GitHub, GitLab, etc.)
4. Domain name (uniaxis.tech)
5. Domain registrar access (for DNS)

---

## 🚀 Step 1: Create Digital Ocean Droplet

### Via Web Interface

1. **Go to**: https://cloud.digitalocean.com/droplets
2. **Click**: "Create" → "Droplets"

### Configure Droplet

**Operating System**
- Choose: "Ubuntu"
- Version: "22.04 x64" (LTS)

**Droplet Size**
- Choose: "$4/month" (512MB RAM, 1 CPU, 25GB SSD)
- Avoid: Any higher tier

**Region**
- Choose: Closest to your users
- Recommended: Singapore, Frankfurt, or Toronto

**Authentication**
- Choose: "SSH Keys" (recommended)
  - OR "Password" (less secure, not recommended)

**Add Options**
- Backups: Not necessary (we'll backup via Git)
- Monitoring: Enabled (recommended)
- IPv6: Enabled (recommended)

**Finalize**
- Hostname: `uniaxis-prod`
- Tags: Add `production`, `web`
- Count: 1

3. **Click**: "Create Droplet"

**Wait**: 1-2 minutes for droplet to spin up

---

## 🔐 Step 2: Initial Security Setup

### Connect via SSH

```bash
# Find your droplet IP address in Digital Ocean panel
ssh root@YOUR_DROPLET_IP

# Or if using SSH key
ssh -i ~/.ssh/id_rsa root@YOUR_DROPLET_IP
```

### Create Non-Root User

```bash
# Create new user
adduser uniaxis
usermod -aG sudo uniaxis

# Test sudo access
sudo -u uniaxis whoami
# Should output: uniaxis
```

### Setup Firewall

```bash
# Enable firewall
ufw enable

# Allow SSH (critical - do this FIRST!)
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Verify rules
ufw status
```

### Update System

```bash
apt update && apt upgrade -y

# Optional: Install useful tools
apt install -y curl wget git nano htop
```

---

## 📦 Step 3: Install Node.js & Dependencies

```bash
# Switch to non-root user
su - uniaxis

# Install Node.js 18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version    # Should show v18.x.x
npm --version     # Should show 9.x.x

# Install PM2 (process manager)
sudo npm install -g pm2

# Verify PM2
pm2 --version
```

---

## 🌐 Step 4: Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/uniaxis
sudo chown uniaxis:uniaxis /var/www/uniaxis

# Navigate to directory
cd /var/www/uniaxis

# Option A: Clone from Git
git clone https://github.com/yourusername/uniaxis.git .

# Option B: Upload files manually
# Use SCP: scp -r ./UniAxis/* uniaxis@YOUR_IP:/var/www/uniaxis/

# Install dependencies
npm install --production
```

---

## 🎯 Step 5: Configure Express Server

Edit `server.js` if needed:

```javascript
// Your server.js should look like this
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(compression());
app.use(express.static('public', { maxAge: '1d' }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### Start Application

```bash
# Start with PM2
pm2 start server.js --name "uniaxis"

# Verify it's running
pm2 status

# View logs
pm2 logs uniaxis
```

---

## 🔄 Step 6: Setup PM2 Auto-Start

```bash
# Create startup script
pm2 startup

# This outputs a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup...
# Run that command:

sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup ubuntu -u uniaxis --hp /home/uniaxis

# Save PM2 process
pm2 save

# Verify (reboot and check)
pm2 status
```

---

## 🌍 Step 7: Setup Nginx Reverse Proxy

### Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Create Nginx Configuration

```bash
# Create config file
sudo nano /etc/nginx/sites-available/uniaxis
```

Paste the following (replace domain as needed):

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name uniaxis.tech www.uniaxis.tech;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name uniaxis.tech www.uniaxis.tech;

    # SSL Configuration (Will add certificates next)
    ssl_certificate /etc/letsencrypt/live/uniaxis.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/uniaxis.tech/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/javascript application/json;

    # Proxy to Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save file: `Ctrl+X` → `Y` → `Enter`

### Enable Configuration

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/uniaxis /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t
# Should output: "test is successful"

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔐 Step 8: Setup SSL Certificate (Let's Encrypt)

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Get Certificate

```bash
# Get SSL certificate
sudo certbot certonly --standalone -d uniaxis.tech -d www.uniaxis.tech

# Follow prompts:
# - Enter email
# - Agree to terms (A)
# - Decline sharing email (N)

# Verify certificate
sudo certbot certificates
```

### Enable Auto-Renewal

```bash
# Test renewal (dry-run)
sudo certbot renew --dry-run

# Enable auto-renewal
sudo systemctl enable certbot.timer

# Check status
sudo systemctl status certbot.timer
```

### Restart Nginx with SSL

```bash
# Reload Nginx with SSL config
sudo systemctl restart nginx

# Test HTTPS
curl -I https://uniaxis.tech
# Should return 200 OK
```

---

## 🌐 Step 9: Configure Domain DNS

### Get Droplet IP

```bash
# From SSH session
hostname -I
# Remember this IP address
```

### Update Domain Registrar

1. **Go to your domain registrar** (Namecheap, GoDaddy, etc.)
2. **Find DNS Management**
3. **Add/Update these records:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_DROPLET_IP | 3600 |
| A | www | YOUR_DROPLET_IP | 3600 |
| AAAA | @ | YOUR_DROPLET_IPV6 | 3600 |

4. **Save changes**

### Verify DNS

```bash
# Wait 5-10 minutes, then test
nslookup uniaxis.tech
# Should show your droplet IP

# Or
dig uniaxis.tech
```

---

## ✅ Step 10: Final Testing

### Test Website

```bash
# From your local computer
curl -I https://uniaxis.tech
# Should return 200 OK

# Test in browser
https://uniaxis.tech
```

### Test SSL

```bash
# Check SSL certificate
openssl s_client -connect uniaxis.tech:443

# Or use SSL checker
# https://www.sslshopper.com/ssl-checker.html#hostname=uniaxis.tech
```

### Test Performance

```bash
# Check response time
curl -w "@-" -o /dev/null -s https://uniaxis.tech << 'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
   time_pretransfer:  %{time_pretransfer}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------
         time_total:  %{time_total}\n
EOF
```

### Check Server Logs

```bash
# Application logs
pm2 logs uniaxis | head -20

# Nginx logs
sudo tail -20 /var/log/nginx/uniaxis_access.log
```

---

## 🔍 Step 11: Monitor & Maintain

### Enable Monitoring

In Digital Ocean dashboard:
- Droplet → Settings → Enable monitoring
- Set up alerts for CPU/Memory

### Useful Commands

```bash
# Check server status
pm2 status

# Monitor resources
pm2 monit

# View real-time logs
pm2 logs uniaxis -f

# Restart application
pm2 restart uniaxis

# Restart Nginx
sudo systemctl restart nginx

# Check disk usage
df -h

# Check memory
free -h

# Check bandwidth
vnstat
```

---

## 🚨 Troubleshooting

### Website Returns 502 Bad Gateway

```bash
# Check if Node.js is running
pm2 status

# Restart Node.js
pm2 restart uniaxis

# Check logs for errors
pm2 logs uniaxis
```

### Port 3000 Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
kill -9 <PID>

# Restart PM2
pm2 restart uniaxis
```

### Nginx Won't Start

```bash
# Test configuration
sudo nginx -t

# View error details
sudo nginx -T

# Check if ports 80/443 are free
sudo lsof -i :80
sudo lsof -i :443
```

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# Restart Nginx
sudo systemctl restart nginx
```

---

## 📊 Performance Optimization

### Enable Caching Headers

Already configured in `server.js` and `nginx.conf`:
- Static files cached for 7 days
- Gzip compression enabled
- HTTP/2 enabled

### Monitor Performance

```bash
# Check response times
pm2 logs | grep "ms"

# Use online tools
# https://gtmetrix.com/
# https://pagespeed.web.dev/
```

---

## 💾 Backup Strategy

### Automated Backups

```bash
# Add to crontab
sudo crontab -e

# Add this line:
0 2 * * * tar -czf /backups/uniaxis-$(date +\%Y\%m\%d).tar.gz /var/www/uniaxis

# Or use Digital Ocean snapshots (paid feature)
```

### Manual Backup

```bash
# Create backup
tar -czf uniaxis-backup-$(date +%Y%m%d).tar.gz /var/www/uniaxis

# Download locally
# Use SCP: scp uniaxis@YOUR_IP:~/uniaxis-backup-*.tar.gz ./
```

---

## 🔄 Update Process

### Update Code

```bash
cd /var/www/uniaxis

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install --production

# Restart application
pm2 restart uniaxis
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update safely
npm update

# Audit security
npm audit fix

# Restart
pm2 restart uniaxis
```

---

## 📈 Scaling (If Needed)

### When Traffic Grows

1. **PM2 Cluster Mode**
   ```bash
   pm2 start server.js -i max  # Use all CPU cores
   ```

2. **Upgrade Droplet**
   - Digital Ocean → Droplet → Resize
   - Choose larger size
   - No downtime migration available

3. **Load Balancing**
   - Setup HAProxy or Nginx load balancer
   - Add multiple droplets
   - Use Digital Ocean Load Balancer

---

## 🎉 Success Checklist

- [ ] Droplet created and running
- [ ] Node.js installed
- [ ] Code deployed
- [ ] PM2 started and auto-starts
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] DNS records updated
- [ ] Website accessible via HTTPS
- [ ] Contact form working
- [ ] Mobile responsive verified
- [ ] Monitoring enabled
- [ ] Backups configured

---

## 📞 Support Resources

- **Digital Ocean Docs**: https://docs.digitalocean.com
- **Node.js Docs**: https://nodejs.org/en/docs
- **Nginx Docs**: https://nginx.org/en/docs
- **Let's Encrypt**: https://letsencrypt.org/docs
- **PM2 Docs**: https://pm2.keymetrics.io/docs

---

## 🆘 Quick Reference

```bash
# Essential Commands
pm2 status              # Check if running
pm2 restart uniaxis     # Restart app
pm2 logs uniaxis        # View logs
pm2 monit               # Monitor resources

sudo systemctl restart nginx      # Restart web server
sudo certbot renew               # Renew SSL
curl -I https://uniaxis.tech     # Test HTTPS

# Useful Paths
/var/www/uniaxis/       # Application folder
/etc/nginx/             # Nginx config
/etc/letsencrypt/       # SSL certificates
/var/log/nginx/         # Nginx logs
```

---

**Estimated Setup Time**: 30 minutes
**Estimated Monthly Cost**: $4
**Expected Uptime**: 99.9%+

**🚀 Your website is now live!**

For detailed information, see [README.md](README.md) and [QUICKSTART.md](QUICKSTART.md)
