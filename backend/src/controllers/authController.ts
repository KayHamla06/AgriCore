// ============================================
// AgriCore — Auth Controller
// All email/password-reset handled by Supabase Auth.
// No SMTP.
// ============================================

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { emailVerificationService } from '../services/emailVerificationService';
import logger from '../utils/logger';

export class AuthController {
  async signUp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, role } = req.body;
      const result = await authService.signUp(email, password, name, role);

      logger.info('User signed up', { email, role });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Account created successfully. Please check your email to verify your account.',
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim();
      const userAgent = req.headers['user-agent'];
      const result = await authService.login(email, password, {
        ip_address: ip,
        user_agent: userAgent,
      });

      logger.info('User logged in', { email });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.slice(7) || '';
      await authService.logout(token);

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response) {
    res.json({
      success: true,
      data: req.user,
    });
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;
      const result = await authService.refreshToken(refresh_token);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Resend Supabase-managed verification email.
   */
  async resendVerificationEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await emailVerificationService.sendVerificationEmail(email);

      res.json({ success: true, message: 'Verification email sent. Please check your inbox.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handle Supabase auth callback — exchange PKCE code for session.
   * Used after email verification redirects back to the app.
   */
  async handleAuthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.exchangeCodeForSession(req.body.code);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Set role for a user (e.g. during onboarding).
   */
  async setRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      await authService.setUserRole(req.user!.id, role);

      logger.info('User role set', { userId: req.user!.id, role });

      res.json({ success: true, message: 'Role set successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Check whether an email address is already registered.
   * Used by the signup form to give instant feedback on step 1.
   */
  async checkEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const available = await authService.isEmailAvailable(email);
      res.json({ success: true, available });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
