/**
 * Email Service - Office 365 SMTP
 *
 * Required Environment Variables:
 *   SMTP_HOST=smtp.office365.com
 *   SMTP_PORT=587
 *   SMTP_USER=your-email@yourdomain.com
 *   SMTP_PASS=your-password-or-app-password
 *   EMAIL_FROM=your-email@yourdomain.com (optional, defaults to SMTP_USER)
 */

const nodemailer = require('nodemailer');

// Check if email is configured
const isEmailConfigured = () => {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

// Create transporter (lazy initialization)
let transporter = null;

const getTransporter = () => {
  if (!transporter && isEmailConfigured()) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.office365.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // Office 365 uses STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
};

/**
 * Send an invitation email to a new user
 * @param {string} email - Recipient email address
 * @param {string} token - Invitation token
 * @param {string} role - User role (user/admin)
 * @param {string} inviterName - Name of the admin sending the invite
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendInviteEmail(email, token, role, inviterName = 'Admin') {
  if (!isEmailConfigured()) {
    console.log('[Email] SMTP not configured - skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  const frontendUrl = process.env.FRONTEND_BASE || 'https://meal-planner-gold-one.vercel.app';
  const acceptUrl = `${frontendUrl}/accept-invite?token=${token}`;
  const appName = 'ASR Health Portal';

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: `You've been invited to ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to ${appName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${appName}!</h1>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi there!</p>

          <p style="font-size: 16px;">${inviterName} has invited you to join <strong>${appName}</strong> as a <strong>${role}</strong>.</p>

          <p style="font-size: 16px;">Click the button below to accept your invitation and set up your account:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              Accept Invitation
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
          <p style="font-size: 14px; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
            <a href="${acceptUrl}" style="color: #667eea;">${acceptUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

          <p style="font-size: 13px; color: #888;">
            This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} ASR Digital Services. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
    text: `
You've been invited to ${appName}!

${inviterName} has invited you to join ${appName} as a ${role}.

Click the link below to accept your invitation:
${acceptUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
    `,
  };

  try {
    const transport = getTransporter();
    if (!transport) {
      return { success: false, error: 'Email transporter not available' };
    }

    const info = await transport.sendMail(mailOptions);
    console.log(`[Email] Invitation sent to ${email}, messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] Failed to send invitation to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test the email configuration
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function testEmailConnection() {
  if (!isEmailConfigured()) {
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('[Email] SMTP connection verified successfully');
    return { success: true };
  } catch (error) {
    console.error('[Email] SMTP connection failed:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendInviteEmail,
  testEmailConnection,
  isEmailConfigured,
};
