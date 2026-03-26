// ============================================
// AgriCore — Email Verification Service
// Sends 6-digit OTP codes via Resend, stores in cache
// ============================================

import { Resend } from 'resend';
import { config } from '../config';
import { cacheService } from './cacheService';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const resend = new Resend(config.resend.apiKey);

const VERIFICATION_TTL = 600; // 10 minutes
const MAX_ATTEMPTS = 5;

function cacheKey(email: string): string {
  return `email_verify:${email.toLowerCase()}`;
}

function attemptsKey(email: string): string {
  return `email_verify_attempts:${email.toLowerCase()}`;
}

function generateCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

export const emailVerificationService = {
  /**
   * Generate a 6-digit code, store it in cache, and send via Resend.
   */
  async sendCode(email: string): Promise<void> {
    const code = generateCode();

    // Store code in cache with 10-minute TTL
    cacheService.set(cacheKey(email), code, VERIFICATION_TTL);
    // Reset attempt counter
    cacheService.set(attemptsKey(email), 0, VERIFICATION_TTL);

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: config.resend.fromEmail,
      to: [email],
      subject: 'Your AgriCore Verification Code',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #16a34a; margin-bottom: 8px;">AgriCore</h2>
          <p style="color: #374151; font-size: 16px;">Your verification code is:</p>
          <div style="background: #f0fdf4; border: 2px solid #16a34a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #15803d;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      logger.error('Failed to send verification email', { email, error: error.message });
      throw new AppError('Failed to send verification email', 500);
    }

    logger.info('Verification code sent', { email });
  },

  /**
   * Verify the code the user entered against the cached code.
   */
  verifyCode(email: string, code: string): boolean {
    const attempts = cacheService.get<number>(attemptsKey(email)) ?? 0;

    if (attempts >= MAX_ATTEMPTS) {
      throw new AppError('Too many failed attempts. Please request a new code.', 429);
    }

    const storedCode = cacheService.get<string>(cacheKey(email));

    if (!storedCode) {
      throw new AppError('Verification code expired or not found. Please request a new code.', 400);
    }

    if (storedCode !== code) {
      cacheService.set(attemptsKey(email), attempts + 1, VERIFICATION_TTL);
      throw new AppError('Invalid verification code', 400);
    }

    // Code is valid — clean up
    cacheService.set(cacheKey(email), undefined, 1);
    cacheService.set(attemptsKey(email), undefined, 1);

    return true;
  },
};
