# UniAxis Technologies Website

A modern, responsive website for UniAxis Technologies - a full-service IT solutions company.

## Features

- **Responsive Design**: Works perfectly on all devices (mobile, tablet, desktop)
- **Fast Performance**: Optimized for cheap droplets with compression and caching
- **Modern UI/UX**: Clean, professional design with smooth animations
- **SEO Optimized**: Proper meta tags and semantic HTML
- **Security**: Helmet.js for security headers
- **Lightweight**: Minimal dependencies for low resource consumption

## Project Structure

```
UniAxis/
├── public/
│   ├── index.html          # Main HTML file
│   ├── css/
│   │   └── styles.css      # All styling
│   ├── js/
│   │   └── script.js       # Interactive features
│   └── images/             # Image assets folder
├── server.js               # Express server
├── package.json            # Dependencies
├── .gitignore              # Git ignore rules
├── README.md               # This file
└── deployment/
    ├── nginx.conf          # Nginx configuration
    └── systemd.service     # Systemd service file
```

## Sections

1. **Home/Hero** - Eye-catching introduction with CTAs
2. **Services** - 6 main service offerings
3. **Campus Ping** - Flagship SaaS product showcase
4. **About** - Company information and stats
5. **Internships** - Join the team opportunities
6. **Contact** - Contact form and information
7. **Footer** - Quick links and details

## Technologies Used

- HTML5
- CSS3 (Modern layouts with Flexbox & Grid)
- Vanilla JavaScript (No jQuery/frameworks)
- Express.js (Minimal, lightweight server)
- Helmet.js (Security)
- Compression (Gzip support)

## Installation & Setup

### Prerequisites
- Node.js 14+ (for running the server)
- npm or yarn

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:3000
```

### Production Deployment

```bash
# Install dependencies
npm install

# Start production server
npm start
```

## Deployment on Digital Ocean

### Using the Cheapest Droplet (512MB RAM)

#### Step 1: Create Droplet
- Choose Ubuntu 22.04 LTS
- Select $4/month (512MB RAM) droplet
- Add your SSH key

#### Step 2: Connect & Install Node.js

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

#### Step 3: Clone & Deploy

```bash
# Clone repository (or upload files)
cd /var/www
git clone <your-repo-url> uniaxis
cd uniaxis

# Install dependencies
npm install

# Start with PM2
pm2 start server.js --name "uniaxis"
pm2 startup
pm2 save
```

#### Step 4: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create config file
sudo nano /etc/nginx/sites-available/uniaxis
```

Paste the nginx.conf content, then:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/uniaxis /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 5: Setup SSL with Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d uniaxis.tech

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Resource Usage

- **RAM**: ~50-100MB (Node.js + Nginx)
- **Disk**: ~200MB (with node_modules)
- **CPU**: Minimal when idle

## Performance Optimization

### Already Included
- Gzip compression
- Static file caching (1 day)
- Minified CSS/JavaScript
- Optimized images (use WebP when possible)
- Helmet security headers

### Further Optimizations
- Add CDN for static assets
- Implement lazy loading for images
- Enable HTTP/2 on Nginx
- Add Redis caching for future features

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers

## Customization Guide

### Update Company Information
Edit `public/index.html`:
- Email addresses
- Domain links
- Phone numbers (if needed)
- Social media links

### Modify Colors
Edit `public/css/styles.css`:
- Primary color: `--primary-color: #4F46E5`
- Secondary color: `--secondary-color: #10B981`
- Change the gradient in hero section

### Add New Sections
1. Add HTML in `index.html`
2. Add CSS in `styles.css`
3. Add JavaScript interactivity in `script.js`

## Email Contact Form

The contact form uses `mailto:` for simplicity. For a backend solution:

```javascript
// Example backend implementation
app.post('/api/contact', (req, res) => {
    // Validate and process form
    // Send email using nodemailer
    // Return response
});
```

## Maintenance

### Regular Tasks
- Monitor disk/memory usage
- Check Nginx/Node.js logs
- Update dependencies monthly
- Review analytics

### Logs Location
- Node.js: `pm2 logs`
- Nginx: `/var/log/nginx/`
- System: `journalctl`

## Security Checklist

- [x] HTTPS enabled (use Certbot)
- [x] Helmet security headers
- [x] Gzip compression
- [x] Rate limiting (add in production)
- [x] Input validation
- [x] No sensitive data in code

## Scaling

As traffic grows:
1. Add PM2 cluster mode
2. Implement load balancing
3. Add Redis caching
4. Use CDN for static assets
5. Upgrade droplet size

## Support & Maintenance

For issues or updates:
- Check error logs
- Review Nginx/Node.js documentation
- Monitor system resources
- Test changes in development first

## License

MIT License - See LICENSE file for details

## Contact

- Email: info@uniaxis.tech
- Website: https://uniaxis.tech
- Project: https://campusping.in

---

**Developed with ❤️ by UniAxis Technologies**
