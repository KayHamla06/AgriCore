// ============================================
// AgriCore — Email Verification Service
// Delegates ALL email verification to Supabase Auth.
// No SMTP / Nodemailer — Supabase sends the emails.
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export const emailVerificationService = {
  /**
   * Resend the Supabase-managed verification email.
   */
  async sendVerificationEmail(email: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.APP_URL || 'https://agricore.site'}/auth/callback`,
      },
    });

    if (error) {
      logger.error('Failed to resend Supabase verification email', { email, error: error.message });
      throw new AppError('Failed to send verification email. Please try again later.', 500);
    }

    logger.info('Supabase verification email resent', { email });
  },
};
