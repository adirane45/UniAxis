# Admin Dashboard Documentation

## Access the Dashboard

Navigate to: `http://your-domain.com/admin.html`

## Default Credentials

- **Username:** `admin`
- **Password:** `uniaxis2026`

⚠️ **IMPORTANT:** Change these credentials in production!

## Features

### Dashboard Overview
- **Total Visitors** - View website traffic statistics
- **Contact Forms** - Monitor form submissions
- **Newsletter Signups** - Track email subscriptions
- **Active Projects** - Manage ongoing projects

### Quick Actions
1. **View Messages** - Check all contact form submissions
2. **Manage Content** - Edit website content
3. **Analytics** - View detailed analytics
4. **Settings** - Configure website settings
5. **Users** - Manage user accounts
6. **Backups** - Download backup files

## Security Notes

1. **Change Default Password**: Update credentials in `admin.html`
2. **Enable HTTPS**: Always use SSL in production
3. **Add Backend Auth**: Implement proper server-side authentication
4. **Rate Limiting**: Already configured for API endpoints
5. **Session Management**: Use secure session tokens

## Future Enhancements

- [ ] Database integration for storing messages
- [ ] Real-time notifications
- [ ] File upload management
- [ ] User role management
- [ ] Advanced analytics graphs
- [ ] Backup automation
- [ ] Email template editor
- [ ] Content management system

## Technical Details

The current dashboard uses:
- Local storage for session management (temporary)
- Client-side authentication (demo only)
- Static statistics (placeholder data)

## Production Setup

For production deployment:

1. Move authentication to backend:
```javascript
// server.js
app.post('/api/admin/login', async (req, res) => {
    // Implement proper JWT authentication
});
```

2. Add database connection:
```javascript
// Store messages in MongoDB/PostgreSQL
```

3. Implement proper session management:
```javascript
// Use express-session with secure cookies
```

4. Add CSP headers:
```javascript
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"]
    }
}));
```

## Support

For issues or questions, contact: support@uniaxis.tech
