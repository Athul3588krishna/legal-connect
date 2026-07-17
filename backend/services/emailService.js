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
 * Sends signup verification OTP
 */
const sendSignupOtpEmail = async (email, otp, username) => {
  const subject = 'Verify your email for LegalAssist';
  const text = `Hi ${username},\n\nPlease verify your email using the following verification code: ${otp}\nThis code is valid for 1 hour.\n\nThank you,\nLegalAssist Team`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #1e3a8a; padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">LegalAssist</h2>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.8; font-weight: 500;">AI-Powered Citizen Legal Guidance</p>
      </div>
      <div style="padding: 32px 24px; color: #334155;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700;">Confirm Your Registration</h3>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">Hello <strong>${username}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">Thank you for registering on LegalAssist. Please enter the following 6-digit verification code to activate your account:</p>
        
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e3a8a; font-family: monospace;">${otp}</span>
        </div>
        
        <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0;">This security code is temporary and will expire in <strong>1 hour</strong>. If you did not register for an account, please ignore this email.</p>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        &copy; ${new Date().getFullYear()} LegalAssist Portal. All rights reserved.
      </div>
    </div>
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
      console.log(`[SMTP] Registration verification email sent successfully to <${email}>`);
    } catch (err) {
      console.error('[SMTP] Error sending registration verification email, falling back to mock logger:', err.message);
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

/**
 * Sends login OTP
 */
const sendLoginOtpEmail = async (email, otp, username) => {
  const subject = 'Your LegalAssist Login Verification Code';
  const text = `Hi ${username},\n\nYour verification code for logging in is: ${otp}\nThis code is valid for 10 minutes.\n\nThank you,\nLegalAssist Team`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #1e3a8a; padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">LegalAssist</h2>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.8; font-weight: 500;">AI-Powered Citizen Legal Guidance</p>
      </div>
      <div style="padding: 32px 24px; color: #334155;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700;">Verify Your Login</h3>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">Hello <strong>${username}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">You are receiving this email to complete your authentication. Please enter the following 6-digit verification code on the login page:</p>
        
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e3a8a; font-family: monospace;">${otp}</span>
        </div>
        
        <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0;">This security code is temporary and will expire in <strong>10 minutes</strong>. If you did not request this code, please ignore this email or change your password.</p>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        &copy; ${new Date().getFullYear()} LegalAssist Portal. All rights reserved.
      </div>
    </div>
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
      console.log(`[SMTP] Login OTP email sent successfully to <${email}>`);
    } catch (err) {
      console.error('[SMTP] Error sending login OTP email, falling back to mock logger:', err.message);
      writeMockEmailToDisk(email, subject, text, html);
    }
  } else {
    writeMockEmailToDisk(email, subject, text, html);
  }
};

module.exports = {
  sendSignupOtpEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
  sendLoginOtpEmail
};
