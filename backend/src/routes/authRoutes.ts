// ============================================
// AgriCore — Auth Routes
// POST /api/auth/signup
// POST /api/auth/login
// POST /api/auth/logout
// GET  /api/auth/me
// POST /api/auth/refresh
// POST /api/auth/resend-verification
// POST /api/auth/callback
// POST /api/auth/set-role
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
  role: z.enum(['farmer', 'advisor', 'supervisor', 'field_agent', 'office_staff']),
  province: z.string().trim().optional(),
  district: z.string().trim().optional(),
  farmSize: z.union([z.string(), z.number()]).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const callbackSchema = z.object({
  code: z.string().min(1, 'Auth code is required'),
});

const setRoleSchema = z.object({
  role: z.enum(['farmer', 'advisor']),
});

const checkEmailSchema = z.object({
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
router.post('/check-email', validate(checkEmailSchema), authController.checkEmail);
router.post('/resend-verification', verificationRateLimit, validate(resendVerificationSchema), authController.resendVerificationEmail);
router.post('/callback', validate(callbackSchema), authController.handleAuthCallback);

// Protected routes
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authMiddleware, authController.logout);
router.post('/set-role', authMiddleware, validate(setRoleSchema), authController.setRole);

export default router;
