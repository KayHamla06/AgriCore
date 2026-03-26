// ============================================
// AgriCore — Data Approval Routes
// Admin endpoints for data review pipeline.
// ============================================

import { Router } from 'express';
import { dataApprovalController } from '../controllers/dataApprovalController';
import { authMiddleware, requireRole } from '../middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('admin'));

// GET /api/data-approval/pending — list pending data requests
router.get('/pending', dataApprovalController.getPending);

// GET /api/data-approval/all — list all data requests
router.get('/all', dataApprovalController.getAll);

// GET /api/data-approval/stats — get approval statistics
router.get('/stats', dataApprovalController.getStats);

// POST /api/data-approval/:requestId/approve — approve data
router.post('/:requestId/approve', dataApprovalController.approve);

// POST /api/data-approval/:requestId/reject — reject data
router.post('/:requestId/reject', dataApprovalController.reject);

export default router;
