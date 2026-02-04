# Post-Launch Checklist & Maintenance Guide

## 🎯 Launch Day Checklist

### Before Going Live
- [ ] All email addresses updated
- [ ] Domain DNS records pointed to server
- [ ] SSL certificate installed and working
- [ ] Contact form tested
- [ ] Mobile responsive test completed
- [ ] All links verified (internal and external)
- [ ] Spelling and grammar check
- [ ] Images optimized
- [ ] 404 page working
- [ ] Backup system active

### Testing
- [ ] Desktop (Chrome, Firefox, Edge, Safari)
- [ ] Tablet (iPad, Android tablets)
- [ ] Mobile (iPhone, Android phones)
- [ ] Touch interactions working
- [ ] Form submissions working
- [ ] Links opening correctly
- [ ] Images loading properly
- [ ] Performance acceptable (<3s load time)

### Deployment Verification
- [ ] Server running (pm2 status shows online)
- [ ] Nginx reverse proxy working
- [ ] SSL certificate valid
- [ ] Redirects working (http → https, www → non-www)
- [ ] Static assets cached properly
- [ ] Logs show no errors

---

## 📊 Post-Launch Monitoring

### Daily Tasks (First Week)
```bash
# Check server status
pm2 status

# Monitor error logs
pm2 logs uniaxis | grep "error"

# Check server resources
pm2 monit
```

### Weekly Tasks
```bash
# Review website analytics
# Check Google Search Console
# Monitor uptime (UptimeRobot)
# Check SSL certificate expiry (90 days)
```

### Monthly Tasks
- Update dependencies: `npm outdated`
- Security audit: `npm audit`
- Backup verification
- Performance analysis
- Analytics review
- Content refresh

---

## 🔧 Common Maintenance Tasks

### Restart Services
```bash
# Restart Node.js application
pm2 restart uniaxis

# Restart Nginx
sudo systemctl restart nginx

# Restart all services
sudo systemctl restart nginx
pm2 restart uniaxis
```

### Update Code
```bash
# Pull latest changes
cd /var/www/uniaxis
git pull origin main

# Install any new dependencies
npm install

# Restart application
pm2 restart uniaxis
```

### View Logs
```bash
# Application logs
pm2 logs uniaxis

# Nginx access logs
sudo tail -f /var/log/nginx/uniaxis_access.log

# Nginx error logs
sudo tail -f /var/log/nginx/uniaxis_error.log

# System logs
journalctl -u nginx -f
```

### SSL Certificate Renewal
```bash
# Check expiry
sudo certbot certificates

# Manual renewal (automatic runs at 2 AM daily)
sudo certbot renew

# Force renewal if needed
sudo certbot renew --force-renewal
```

---

## 🐛 Troubleshooting Guide

### Website Returns 502 Bad Gateway
```bash
# Check if Node.js is running
pm2 status

# Check Node.js logs for errors
pm2 logs uniaxis

# Restart Node.js
pm2 restart uniaxis

# If still failing, check port 3000
sudo lsof -i :3000
```

### High CPU/Memory Usage
```bash
# Check what's using resources
pm2 monit

# Check Node.js for memory leaks
node --inspect server.js

# If stuck, force restart
pm2 kill
pm2 start server.js
```

### SSL Certificate Issues
```bash
# Check certificate details
sudo certbot certificates

# Test SSL configuration
sudo nginx -t

# Check certificate validity
openssl s_client -connect uniaxis.tech:443
```

### Nginx Not Starting
```bash
# Check configuration syntax
sudo nginx -t

# View detailed errors
sudo nginx -T

# Check if port 80/443 in use
sudo lsof -i :80
sudo lsof -i :443

# Restart with debug
sudo nginx -g 'daemon off;'
```

### Contact Form Not Working
```bash
# Check browser console for JavaScript errors
# Verify email address in HTML
# Test form manually

# Check if form submission logs appear
pm2 logs uniaxis | grep "contact\|form"
```

---

## 📈 Performance Monitoring

### Setup Uptime Monitoring
1. Go to https://uptimerobot.com
2. Add new monitor: `https://uniaxis.tech`
3. Set 5-minute check interval
4. Add email notifications

### Setup Analytics
```html
<!-- Add to public/index.html before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Monitor Bandwidth
```bash
# Check bandwidth usage
vnstat -h      # Hourly usage
vnstat -d      # Daily usage
vnstat -m      # Monthly usage
```

### Performance Testing
- Load test: https://www.loadimpact.com
- Speed test: https://gtmetrix.com
- SEO audit: https://www.seositecheckup.com

---

## 🔒 Security Maintenance

### Weekly Security Check
```bash
# Check for security updates
sudo apt list --upgradable

# Install security updates
sudo apt update && sudo apt upgrade -y

# Check Node.js security advisories
npm audit

# Fix security vulnerabilities
npm audit fix
```

### Monitor Suspicious Activity
```bash
# Check for brute force attempts
sudo grep "Failed password" /var/log/auth.log | wc -l

# Monitor failed login attempts
sudo fail2ban-client status

# Review access logs for unusual patterns
sudo grep "4[0-9][0-9]" /var/log/nginx/uniaxis_access.log | wc -l
```

### Backup Verification
```bash
# List recent backups
ls -lah /backups/

# Test restore capability
tar -tzf /backups/uniaxis-20240115.tar.gz | head -20

# Verify backup size (should be ~50MB)
du -sh /backups/uniaxis-*.tar.gz
```

---

## 📝 Content Updates

### Update Services
Edit `public/index.html` section "Our Services"

### Update About Info
Edit `public/index.html` section "About UniAxis"

### Update Team Members
Add to "About" section:
```html
<div class="team-member">
    <img src="/images/team-member.jpg" alt="Name">
    <h3>Name</h3>
    <p>Position</p>
</div>
```

### Update Internship Positions
Edit `public/index.html` section "Internships"

---

## 💾 Backup Strategy

### Automated Daily Backups
```bash
# Add to crontab (crontab -e)
0 2 * * * tar -czf /backups/uniaxis-$(date +\%Y\%m\%d).tar.gz /var/www/uniaxis

# Keep only 30 days of backups
0 3 * * * find /backups -name "uniaxis-*.tar.gz" -mtime +30 -delete
```

### Manual Backup
```bash
# Create backup
tar -czf uniaxis-backup-$(date +%Y%m%d).tar.gz /var/www/uniaxis

# Restore from backup
tar -xzf uniaxis-backup-20240115.tar.gz -C /var/www
pm2 restart uniaxis
```

### Offsite Backup
```bash
# Backup to AWS S3
aws s3 cp /backups/uniaxis-latest.tar.gz s3://my-bucket/backups/

# Backup to Digital Ocean Spaces
doctl compute volume-snapshot create backup-volume --size 100G
```

---

## 🚀 Scaling Checklist

As traffic grows, implement:

### Phase 1: Optimization (Current)
- [x] Gzip compression
- [x] Static file caching
- [x] Minified CSS/JS
- [ ] Add CDN (Cloudflare)
- [ ] Image optimization (WebP)

### Phase 2: High Traffic (1000+ daily)
- [ ] PM2 cluster mode
- [ ] Redis caching
- [ ] Database optimization
- [ ] Load testing

### Phase 3: Enterprise (10000+ daily)
- [ ] Load balancer (HAProxy)
- [ ] Multiple app servers
- [ ] Dedicated database server
- [ ] CDN configuration

---

## 🎓 Important Dates

### SSL Certificate Renewal
- Check every 30 days: `sudo certbot certificates`
- Auto-renewal: Every day at 2 AM
- Manual renewal: `sudo certbot renew`

### Droplet Billing
- Renews: Every month
- Cost: $4/month
- Payment method: Add to Digital Ocean account

### DNS Renewal
- Expires: Check domain registrar
- Renewal reminder: 30 days before expiry

---

## 📞 Emergency Contacts

### If Website Goes Down
1. Check server: `pm2 status`
2. Restart services: `pm2 restart uniaxis`
3. Check logs: `pm2 logs`
4. If still down, restart droplet via Digital Ocean panel

### If SSL Certificate Expires
1. Verify: `sudo certbot certificates`
2. Renew: `sudo certbot renew`
3. Restart Nginx: `sudo systemctl restart nginx`

### If Server Crashes
1. SSH into droplet
2. Check system resources: `free -h`, `df -h`
3. Check running processes: `ps aux`
4. Restart services
5. Contact Digital Ocean support if hardware issue

---

## 📚 Documentation Reference

- **Full Guide**: [README.md](README.md)
- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)
- **Code**: Check `public/`, `server.js`
- **Deployment**: Check `deployment/` folder

---

## ✅ Monthly Checklist Template

```
MONTH: __________

[ ] Security updates applied
[ ] Backups verified
[ ] SSL certificate valid
[ ] Performance acceptable
[ ] Analytics reviewed
[ ] Dependencies updated
[ ] No critical errors in logs
[ ] Uptime monitoring active
[ ] Contacts updated (if changed)
[ ] Database optimized
```

---

**Last Updated**: February 2026
**Maintained By**: UniAxis Technologies
**Support**: info@uniaxis.tech
