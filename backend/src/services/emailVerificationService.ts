// ============================================
// AgriCore — Email Verification Service
// Sends verification link via TurboSMTP (Nodemailer),
// stores token in cache for link-based verification
// ============================================

import nodemailer from 'nodemailer';
import { config } from '../config';
import { cacheService } from './cacheService';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import crypto from 'crypto';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false, // STARTTLS on port 587
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

const TOKEN_TTL = 86400; // 24 hours

function tokenKey(token: string): string {
  return `email_verify_token:${token}`;
}

function emailTokenKey(email: string): string {
  return `email_verify_email:${email.toLowerCase()}`;
}

function generateToken(): string {
  return crypto.randomUUID();
}

export const emailVerificationService = {
  /**
   * Generate a unique token, store it in cache, and send a verification link via SMTP.
   */
  async sendVerificationEmail(email: string): Promise<void> {
    const token = generateToken();

    // Store token → email mapping (for lookup when user clicks link)
    cacheService.set(tokenKey(token), email.toLowerCase(), TOKEN_TTL);
    // Store email → token mapping (to invalidate old tokens)
    const oldToken = cacheService.get<string>(emailTokenKey(email));
    if (oldToken) {
      cacheService.set(tokenKey(oldToken), undefined, 1); // expire old token
    }
    cacheService.set(emailTokenKey(email), token, TOKEN_TTL);

    const verifyUrl = `${config.appUrl}/verify?token=${token}`;

    const mailOptions = {
      from: config.smtp.fromEmail,
      to: email,
      subject: 'Verify Your AgriCore Email Address',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #ffffff;">
          <h2 style="color: #16a34a; margin-bottom: 8px;">AgriCore</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for registering! Please verify your email address by clicking the button below.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" 
               style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none;
                      padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600;">
              Verify My Email
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #2563eb; font-size: 13px; word-break: break-all;">${verifyUrl}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            This link expires in 24 hours. If you didn't create an AgriCore account, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info('Verification email sent', { email });
    } catch (err: any) {
      logger.error('Failed to send verification email', { email, error: err.message });
      throw new AppError('Failed to send verification email. Please try again later.', 500);
    }
  },

  /**
   * Verify a token from the email link. Returns the email if valid.
   */
  verifyToken(token: string): string {
    const email = cacheService.get<string>(tokenKey(token));

    if (!email) {
      throw new AppError('Verification link is invalid or has expired. Please request a new one.', 400);
    }

    // Token is valid — clean up
    cacheService.set(tokenKey(token), undefined, 1);
    cacheService.set(emailTokenKey(email), undefined, 1);

    return email;
  },
};
