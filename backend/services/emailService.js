const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Ensure email log folder exists for mock testing
const emailLogDir = path.join(__dirname, '../logs/emails');
if (!fs.existsSync(emailLogDir)) {
  fs.mkdirSync(emailLogDir, { recursive: true });
}

// Helper to write mock email to disk for easy verification
const writeMockEmailToDisk = (to, subject, text, html) => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const logFile = path.join(emailLogDir, `email-to-${to}-${timestamp}.txt`);
  
  const content = `
=============================================
MOCK EMAIL LOG
=============================================
Timestamp: ${new Date().toLocaleString()}
To: ${to}
Subject: ${subject}
---------------------------------------------
TEXT CONTENT:
${text}
---------------------------------------------
HTML CONTENT:
${html}
=============================================
`;
  
  fs.writeFileSync(logFile, content, 'utf8');
  console.log(`[MOCK EMAIL] Email to <${to}> logged successfully at: ${logFile}`);
  console.log(content);
};

/**
 * Get nodemailer transport if SMTP config is provided, else return null
 */
const getTransporter = () => {
  if (
    process.env.SMTP_HOST && 
    process.env.SMTP_PORT && 
    process.env.SMTP_USER && 
    process.env.SMTP_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
};

/**
 * Sends email verification token
 */
const sendVerificationEmail = async (email, token, username) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
  
  const subject = 'Verify your email for LegalAssist';
  const text = `Hi ${username},\n\nPlease verify your email by clicking the following link: ${verificationLink}\n\nThank you,\nLegalAssist Team`;
  const html = `
    <h3>Hi ${username},</h3>
    <p>Thank you for registering on LegalAssist. Please click the button below to verify your email address:</p>
    <a href="${verificationLink}" style="display:inline-block;padding:10px 20px;background-color:#1e3a8a;color:#ffffff;text-decoration:none;border-radius:5px;font-weight:bold;">Verify Email Address</a>
    <p>If the button doesn't work, copy and paste this link in your browser:</p>
    <p><a href="${verificationLink}">${verificationLink}</a></p>
    <br/>
    <p>Best regards,<br/>LegalAssist Team</p>
  `;

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'LegalAssist Portal'}" <${process.env.SMTP_FROM_EMAIL || 'no-reply@legalassist.com'}>`,
        to: email,
        subject,
        text,
        html
      });
      console.log(`[SMTP] Verification email sent successfully to <${email}>`);
    } catch (err) {
      console.error('[SMTP] Error sending verification email, falling back to mock logger:', err.message);
      writeMockEmailToDisk(email, subject, text, html);
    }
  } else {
    writeMockEmailToDisk(email, subject, text, html);
  }
};

/**
 * Sends password reset token
 */
const sendPasswordResetEmail = async (email, token, username) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;
  
  const subject = 'Reset your password for LegalAssist';
  const text = `Hi ${username},\n\nYou requested a password reset. Please use the following link to reset your password: ${resetLink}\nThis link is valid for 1 hour.\n\nIf you did not request this, please ignore this email.\n\nLegalAssist Team`;
  const html = `
    <h3>Hi ${username},</h3>
    <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
    <p>Please click the button below to set a new password. This link is valid for 1 hour:</p>
    <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background-color:#ea580c;color:#ffffff;text-decoration:none;border-radius:5px;font-weight:bold;">Reset Password</a>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    <br/>
    <p>Best regards,<br/>LegalAssist Team</p>
  `;

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'LegalAssist Portal'}" <${process.env.SMTP_FROM_EMAIL || 'no-reply@legalassist.com'}>`,
        to: email,
        subject,
        text,
        html
      });
      console.log(`[SMTP] Password reset email sent successfully to <${email}>`);
    } catch (err) {
      console.error('[SMTP] Error sending password reset email, falling back to mock logger:', err.message);
      writeMockEmailToDisk(email, subject, text, html);
    }
  } else {
    writeMockEmailToDisk(email, subject, text, html);
  }
};

/**
 * Sends user notification alerts
 */
const sendNotificationEmail = async (email, subject, messageText) => {
  const text = `Hi,\n\n${messageText}\n\nBest regards,\nLegalAssist Team`;
  const html = `
    <h3>Hello,</h3>
    <p>${messageText}</p>
    <br/>
    <p>Best regards,<br/>LegalAssist Team</p>
  `;

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'LegalAssist Portal'}" <${process.env.SMTP_FROM_EMAIL || 'no-reply@legalassist.com'}>`,
        to: email,
        subject,
        text,
        html
      });
    } catch (err) {
      writeMockEmailToDisk(email, subject, text, html);
    }
  } else {
    writeMockEmailToDisk(email, subject, text, html);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail
};
