// ============================================
// AgriCore — Password Reset Routes
// POST /api/auth/forgot-password
// POST /api/auth/reset-password
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { passwordResetController } from '../controllers/passwordResetController';
import { validate } from '../middleware';

const router = Router();

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// POST /api/auth/forgot-password — request a reset link
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  passwordResetController.requestReset
);

// POST /api/auth/reset-password — use token to set new password
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  passwordResetController.resetPassword
);

export default router;
