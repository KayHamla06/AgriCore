// ============================================
// AgriCore — Password Reset Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { passwordResetService } from '../services/passwordResetService';
import logger from '../utils/logger';

export class PasswordResetController {
  async requestReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await passwordResetService.requestReset(email);

      logger.info('Password reset requested', { email });

      // Always return 200 — don't reveal whether email exists
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      await passwordResetService.resetPassword(token, newPassword);

      res.json({ success: true, message: 'Password has been reset successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

export const passwordResetController = new PasswordResetController();
