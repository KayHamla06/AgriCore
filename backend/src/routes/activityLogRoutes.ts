// ============================================
// AgriCore — Activity Log Routes (Admin only)
// ============================================

import { Router } from 'express';
import { activityLogController } from '../controllers/activityLogController';
import { authMiddleware, requireRole } from '../middleware';

const router = Router();

// Admin-only access
router.use(authMiddleware, requireRole('admin'));

// Get activity logs with optional filters (?user_id=, ?resource_type=, ?limit=, ?offset=)
router.get('/', activityLogController.getAll);

export default router;
