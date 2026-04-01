// ============================================
// AgriCore — Password Reset Controller
// Delegates to Supabase Auth — no SMTP.
// ============================================

import { Request, Response, NextFunction } from 'express';
import { passwordResetService } from '../services/passwordResetService';
import logger from '../utils/logger';

export class PasswordResetController {
  async requestReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await passwordResetService.requestReset(email);

      logger.info('Password reset requested via Supabase', { email });

      // Always return 200 — don't reveal whether email exists
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  /**
   * After the user clicks the Supabase reset link, they arrive at /auth/callback
   * with a valid session. They can then call this endpoint with their token + new password.
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, newPassword } = req.body;
      await passwordResetService.resetPassword(accessToken, newPassword);

      res.json({ success: true, message: 'Password has been reset successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

export const passwordResetController = new PasswordResetController();
