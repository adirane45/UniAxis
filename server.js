const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// Body parser middleware
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Contact form rate limiter (stricter)
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 requests per hour
    message: 'Too many contact submissions from this IP, please try again later.'
});

// Static files with caching
app.use(express.static('public', {
    maxAge: '1d',
    etag: false
}));

// API routes
app.use('/api/', apiLimiter);

// Contact form API endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
    try {
        const { name, email, phone, subject, service, message } = req.body;
        
        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        // Message validation
        if (message.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Message must be at least 10 characters'
            });
        }
        
        // Create email content
        const emailContent = `
            <h1>New Contact Form Submission</h1>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
            ${service ? `<p><strong>Service Interested:</strong> ${escapeHtml(service)}</p>` : ''}
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <h2>Message:</h2>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Submitted at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</small></p>
            <p><small>IP Address: ${req.ip}</small></p>
        `;
        
        // Send email
        await sendEmail({
            to: process.env.CONTACT_EMAIL || 'info@uniaxis.tech',
            subject: `New Contact Form: ${subject}`,
            html: emailContent
        });
        
        // Send confirmation email to user
        await sendEmail({
            to: email,
            subject: 'We received your message - UniAxis Technologies',
            html: `
                <h1>Thank You for Contacting UniAxis Technologies</h1>
                <p>Hi ${escapeHtml(name)},</p>
                <p>We have received your message and will get back to you within 24 hours.</p>
                <h3>Your Message Details:</h3>
                <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
                <p><strong>Message:</strong></p>
                <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
                <hr>
                <p>If you have any urgent queries, please contact us at <a href="tel:+919876543210">+91 98765 43210</a></p>
                <p>Best regards,<br>UniAxis Technologies Team</p>
            `
        });
        
        return res.status(200).json({
            success: true,
            message: 'Message sent successfully!'
        });
        
    } catch (error) {
        console.error('Error processing contact form:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing your request. Please try again later.'
        });
    }
});

// Newsletter subscription endpoint
app.post('/api/newsletter', contactLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        // Here you would typically save to a database
        // For now, we'll just send a confirmation email
        
        await sendEmail({
            to: email,
            subject: 'Welcome to UniAxis Newsletter',
            html: `
                <h1>Welcome to UniAxis Newsletter</h1>
                <p>Thank you for subscribing to our newsletter!</p>
                <p>You'll now receive updates about our services, products, and special offers.</p>
                <p>Best regards,<br>UniAxis Technologies Team</p>
            `
        });
        
        return res.status(200).json({
            success: true,
            message: 'Subscription successful!'
        });
        
    } catch (error) {
        console.error('Error processing newsletter:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing subscription. Please try again later.'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const server = app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   UniAxis Technologies Website         ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║  Server running on port ${PORT}`.padEnd(41) + '║');
    console.log(`║  URL: http://localhost:${PORT}`.padEnd(41) + '║');
    console.log('║  Environment: ' + (process.env.NODE_ENV || 'development').padEnd(26) + '║');
    console.log('╚════════════════════════════════════════╝');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n[SIGTERM] Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n[SIGINT] Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// =====================================
// EMAIL SENDING FUNCTION
// =====================================

async function sendEmail({ to, subject, html }) {
    try {
        // Create transporter based on environment
        let transporter;
        
        if (process.env.SMTP_HOST) {
            // Using custom SMTP
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            // Using Gmail (requires App Password)
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASS
                }
            });
        }
        
        // Send email
        const info = await transporter.sendMail({
            from: process.env.SENDER_EMAIL || 'noreply@uniaxis.tech',
            to: to,
            subject: subject,
            html: html
        });
        
        console.log('Email sent:', info.messageId);
        return info;
        
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw - we want form to succeed even if email fails
        return null;
    }
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Export app for testing
module.exports = app;
