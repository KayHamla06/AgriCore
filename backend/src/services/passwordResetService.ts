// ============================================
// AgriCore — Password Reset Service
// Secure, one-time-use expiring reset tokens
// ============================================

import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export class PasswordResetService {
  /**
   * Generate a password reset token and store its hash in the DB.
   * Returns the raw token (to be sent via email).
   */
  async requestReset(email: string): Promise<{ message: string }> {
    // 1. Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, auth_id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Don't reveal whether the email exists — always return success
      logger.info('Password reset requested for unknown email', { email });
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    // 2. Invalidate any existing pending reset tokens for this user
    await supabaseAdmin
      .from('password_resets')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false);

    // 3. Generate cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS).toISOString();

    // 4. Store hashed token in DB
    const { error: insertError } = await supabaseAdmin
      .from('password_resets')
      .insert({
        user_id: user.id,
        token_hash: hashedToken,
        expires_at: expiresAt,
        used: false,
      });

    if (insertError) {
      logger.error('Failed to store password reset token', {
        userId: user.id,
        error: insertError.message,
      });
      throw new AppError('Failed to create reset request', 500);
    }

    // In production, send email here with the rawToken in a link.
    // For dev/demo, log it (NEVER log in production).
    logger.info('Password reset token generated', {
      userId: user.id,
      token: rawToken, // Remove in production — send via email instead
      expiresAt,
    });

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  /**
   * Verify a reset token and change the user's password.
   * Token is one-time use and must not be expired.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // 1. Hash the provided token to match against DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 2. Find the token record
    const { data: resetRecord, error } = await supabaseAdmin
      .from('password_resets')
      .select('id, user_id, expires_at, used')
      .eq('token_hash', hashedToken)
      .single();

    if (error || !resetRecord) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // 3. Check if already used
    if (resetRecord.used) {
      throw new AppError('This reset link has already been used', 400);
    }

    // 4. Check expiry
    if (new Date(resetRecord.expires_at) < new Date()) {
      // Mark as used so it can't be retried
      await supabaseAdmin
        .from('password_resets')
        .update({ used: true })
        .eq('id', resetRecord.id);

      throw new AppError('Reset link has expired. Please request a new one.', 400);
    }

    // 5. Get user's auth_id to update password in Supabase Auth
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('auth_id')
      .eq('id', resetRecord.user_id)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    // 6. Update password in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      user.auth_id,
      { password: newPassword }
    );

    if (authError) {
      logger.error('Failed to update password via Supabase Auth', {
        userId: resetRecord.user_id,
        error: authError.message,
      });
      throw new AppError('Failed to reset password', 500);
    }

    // 7. Mark token as used (one-time use)
    await supabaseAdmin
      .from('password_resets')
      .update({ used: true })
      .eq('id', resetRecord.id);

    logger.info('Password reset completed', { userId: resetRecord.user_id });
  }
}

export const passwordResetService = new PasswordResetService();
