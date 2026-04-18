// ============================================
// AgriCore — Notice Board Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { noticeService } from '../services/noticeService';
import { AppError } from '../middleware/errorHandler';
import validator from 'validator';

export class NoticeController {
  /**
   * POST /api/notices
   * Create a new notice (admin/advisor only).
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, message, expiry_date, is_pinned, targets } = req.body;
      const user = req.user!;

      if (!title || !message) {
        throw new AppError('Title and message are required', 400);
      }
      if (typeof title !== 'string' || title.length > 200) {
        throw new AppError('Title must be 200 characters or less', 400);
      }
      if (typeof message !== 'string' || message.length > 2000) {
        throw new AppError('Message must be 2000 characters or less', 400);
      }

      if (user.role !== 'admin' && user.role !== 'advisor') {
        throw new AppError('Only admins and advisors can create notices', 403);
      }

      // Sanitize
      const sanitizedTitle = validator.escape(validator.trim(title));
      const sanitizedMessage = validator.trim(message);

      const notice = await noticeService.create(
        {
          title: sanitizedTitle,
          message: sanitizedMessage,
          expiry_date: expiry_date || null,
          is_pinned: !!is_pinned,
          targets: Array.isArray(targets) ? targets : [],
        },
        user.id,
        user.role as 'admin' | 'advisor',
      );

      res.status(201).json({ success: true, data: notice });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notices/active
   * Get active notices for the current user (filtered by targets).
   */
  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const notices = await noticeService.getActiveForUser(user.id, user.role);
      res.json({ success: true, data: notices });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notices
   * Get all notices (admin/advisor management view).
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      if (user.role !== 'admin' && user.role !== 'advisor') {
        throw new AppError('Access denied', 403);
      }
      const notices = await noticeService.getAll();
      res.json({ success: true, data: notices });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/notices/:id
   * Delete a notice. Admin can delete any; advisor can delete own only.
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;

      if (user.role !== 'admin' && user.role !== 'advisor') {
        throw new AppError('Access denied', 403);
      }

      await noticeService.delete(id, user.id, user.role);
      res.json({ success: true, message: 'Notice deleted' });
    } catch (err) {
      if (err instanceof Error && err.message === 'FORBIDDEN') {
        return next(new AppError('You can only delete your own notices', 403));
      }
      next(err);
    }
  }

  /**
   * POST /api/notices/:id/view
   * Record that the current user viewed this notice.
   */
  async recordView(req: Request, res: Response, next: NextFunction) {
    try {
      await noticeService.recordView(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notices/:id/stats
   * Get view stats for a notice (admin/advisor).
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      if (user.role !== 'admin' && user.role !== 'advisor') {
        throw new AppError('Access denied', 403);
      }
      const stats = await noticeService.getViewStats(req.params.id);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

export const noticeController = new NoticeController();
