// ============================================
// AgriCore — Notification Routes
// ============================================

import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authMiddleware } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get notifications (optionally unread only via ?unread=true)
router.get('/', notificationController.getAll);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark all as read
router.patch('/read-all', notificationController.markAllRead);

// Mark single notification as read
router.patch('/:id/read', notificationController.markRead);

// Delete notification
router.delete('/:id', notificationController.delete);

export default router;
