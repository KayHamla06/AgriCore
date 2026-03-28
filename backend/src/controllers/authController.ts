// ============================================
// AgriCore — Auth Controller
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
        message: 'Account created successfully',
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

  async sendVerificationEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await emailVerificationService.sendVerificationEmail(email);

      res.json({ success: true, message: 'Verification email sent. Please check your inbox.' });
    } catch (err) {
      next(err);
    }
  }

  async verifyEmailToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        res.status(400).json({ success: false, message: 'Missing or invalid token.' });
        return;
      }

      const email = emailVerificationService.verifyToken(token);

      logger.info('Email verified via link', { email });

      res.json({ success: true, message: 'Email verified successfully', data: { email } });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
