// ============================================
// AgriCore — Auth Routes
// POST /api/auth/signup
// POST /api/auth/login
// POST /api/auth/logout
// GET  /api/auth/me
// POST /api/auth/refresh
// POST /api/auth/send-verification
// GET  /api/auth/verify-email
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/authController';
import { authMiddleware, validate } from '../middleware';

const router = Router();

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['farmer', 'government', 'supervisor', 'field_agent', 'office_staff']), // Admin accounts are created internally only
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

const sendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Rate limit for verification emails: 3 requests per 15 minutes per IP
const verificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many verification requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/signup', validate(signUpSchema), authController.signUp);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refreshToken);
router.post('/send-verification', verificationRateLimit, validate(sendVerificationSchema), authController.sendVerificationEmail);
router.get('/verify-email', authController.verifyEmailToken);

// Protected routes
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authMiddleware, authController.logout);

export default router;
