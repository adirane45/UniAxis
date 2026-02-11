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

// Professional Email Template Function
function createEmailTemplate({ title, preheader, content }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>${title}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px; background: linear-gradient(135deg, #4f46e5, #10b981); text-align: center;">
                            <div style="display: inline-block;">
                                <svg width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="50" cy="50" r="45" fill="white"/>
                                    <text x="50" y="65" font-size="50" font-weight="bold" fill="#4f46e5" text-anchor="middle">U</text>
                                </svg>
                            </div>
                            <h1 style="color: white; margin: 15px 0 5px; font-size: 24px; font-weight: 700;">UniAxis Technologies</h1>
                            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 14px;">IT Solutions & Innovation</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    ${content}
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #1f2937; text-align: center;">
                            <p style="color: rgba(255, 255, 255, 0.8); margin: 0 0 15px; font-size: 14px;">
                                📍 Jalgaon, Maharashtra, India | 📧 info@uniaxis.tech
                            </p>
                            <div style="margin: 15px 0;">
                                <a href="#" style="display: inline-block; margin: 0 8px; color: rgba(255, 255, 255, 0.6); text-decoration: none;">LinkedIn</a>
                                <a href="#" style="display: inline-block; margin: 0 8px; color: rgba(255, 255, 255, 0.6); text-decoration: none;">Twitter</a>
                                <a href="#" style="display: inline-block; margin: 0 8px; color: rgba(255, 255, 255, 0.6); text-decoration: none;">GitHub</a>
                            </div>
                            <p style="color: rgba(255, 255, 255, 0.5); margin: 15px 0 0; font-size: 12px;">
                                © 2026 UniAxis Technologies. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

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
        
        // Create professional admin email
        const adminEmailContent = createEmailTemplate({
            title: 'New Contact Form Submission',
            preheader: `From ${name}`,
            content: `
                <tr>
                    <td style="padding: 30px; background-color: #ffffff;">
                        <h2 style="color: #1f2937; margin-top: 0;">New Contact Request</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(name)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${email}">${escapeHtml(email)}</a></td>
                            </tr>
                            ${phone ? `<tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(phone)}</td>
                            </tr>` : ''}
                            ${service ? `<tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><strong>Service:</strong></td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(service)}</td>
                            </tr>` : ''}
                            <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><strong>Subject:</strong></td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(subject)}</td>
                            </tr>
                        </table>
                        <div style="margin-top: 20px; padding: 20px; background-color: #f9fafb; border-left: 4px solid #4f46e5; border-radius: 4px;">
                            <strong style="color: #1f2937;">Message:</strong>
                            <p style="margin: 10px 0 0; color: #4b5563; line-height: 1.6;">${escapeHtml(message).replace(/\n/g, '<br>')}</p>
                        </div>
                        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                            Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} | IP: ${req.ip}
                        </p>
                    </td>
                </tr>
            `
        });
        
        // Send email to admin
        await sendEmail({
            to: process.env.CONTACT_EMAIL || 'info@uniaxis.tech',
            subject: `New Contact Form: ${subject}`,
            html: adminEmailContent
        });
        
        // Create professional confirmation email for user
        const userConfirmation = createEmailTemplate({
            title: 'Thank You for Contacting Us',
            preheader: 'We received your message',
            content: `
                <tr>
                    <td style="padding: 40px 30px; background-color: #ffffff; text-align: center;">
                        <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #4f46e5, #10b981); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h2 style="color: #1f2937; margin: 0 0 20px;">Thank You, ${escapeHtml(name)}!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                            We've received your message and our team will get back to you within 24 hours.
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 30px; background-color: #f9fafb;">
                        <h3 style="color: #1f2937; margin-top: 0;">Your Message Summary</h3>
                        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                            <p style="margin: 0 0 10px;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
                            <p style="margin: 0;"><strong>Message:</strong></p>
                            <p style="color: #4b5563; margin: 10px 0 0;">${escapeHtml(message).replace(/\n/g, '<br>')}</p>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 30px; background-color: #ffffff; text-align: center;">
                        <p style="color: #4b5563; margin: 0 0 20px;">Need immediate assistance?</p>
                        <a href="tel:+919876543210" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #4f46e5, #10b981); color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
                            Call Us: +91 98765 43210
                        </a>
                    </td>
                </tr>
            `
        });
        
        // Send confirmation to user
        await sendEmail({
            to: email,
            subject: 'We received your message - UniAxis Technologies',
            html: userConfirmation
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
