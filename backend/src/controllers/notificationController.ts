// ============================================
// AgriCore — Notification Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';

export class NotificationController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const unreadOnly = req.query.unread === 'true';
      const notifications = await notificationService.getAll(req.user!.id, unreadOnly);
      res.json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await notificationService.getUnreadCount(req.user!.id);
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markRead(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Marked as read' });
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllRead(req.user!.id);
      res.json({ success: true, message: 'All marked as read' });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
