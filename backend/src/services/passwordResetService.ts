// ============================================
// AgriCore — Password Reset Service
// Delegates ALL password reset to Supabase Auth.
// No custom tokens or SMTP — Supabase handles it.
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class PasswordResetService {
  /**
   * Request a password reset email via Supabase Auth.
   * Supabase sends the email automatically.
   */
  async requestReset(email: string): Promise<{ message: string }> {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL || 'https://agricore.site'}/auth/callback?type=recovery`,
    });

    if (error) {
      logger.error('Supabase password reset request failed', { email, error: error.message });
      // Don't reveal whether the email exists
    }

    logger.info('Password reset requested via Supabase', { email });
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  /**
   * Update password using a valid Supabase session (after clicking reset link).
   * The user arrives at /auth/callback with a valid session from Supabase.
   */
  async resetPassword(accessToken: string, newPassword: string): Promise<void> {
    // Verify the session token first
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      throw new AppError('Invalid or expired reset session', 400);
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (error) {
      logger.error('Failed to update password via Supabase Auth', {
        userId: user.id,
        error: error.message,
      });
      throw new AppError('Failed to reset password', 500);
    }

    logger.info('Password reset completed via Supabase', { userId: user.id });
  }
}

export const passwordResetService = new PasswordResetService();
