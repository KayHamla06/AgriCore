// ============================================
// AgriCore — Notice Board Routes
// ============================================

import { Router } from 'express';
import { noticeController } from '../controllers/noticeController';
import { authMiddleware, requireRole } from '../middleware';

const router = Router();

router.use(authMiddleware);

// GET /api/notices/active — filtered notices for current user
router.get('/active', noticeController.getActive);

// GET /api/notices — all notices (admin/advisor management)
router.get('/', noticeController.getAll);

// POST /api/notices — create notice (admin/advisor)
router.post('/', requireRole('admin', 'advisor'), noticeController.create);

// DELETE /api/notices/:id — delete notice
router.delete('/:id', requireRole('admin', 'advisor'), noticeController.delete);

// POST /api/notices/:id/view — record view
router.post('/:id/view', noticeController.recordView);

// GET /api/notices/:id/stats — view analytics (admin/advisor)
router.get('/:id/stats', requireRole('admin', 'advisor'), noticeController.getStats);

export default router;
