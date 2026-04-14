// ============================================
// AgriCore — Data Approval Routes
// Admin endpoints for data review pipeline.
// Advisor submit endpoint for proposing changes.
// ============================================

import { Router } from 'express';
import { dataApprovalController } from '../controllers/dataApprovalController';
import { authMiddleware, requireRole } from '../middleware';

const router = Router();

router.use(authMiddleware);

// POST /api/data-approval/submit — advisor/field_agent submits data for approval
router.post(
  '/submit',
  requireRole('advisor', 'field_agent', 'supervisor'),
  dataApprovalController.submit
);

// GET /api/data-approval/my-submissions — advisor sees own submissions
router.get(
  '/my-submissions',
  requireRole('advisor', 'field_agent', 'supervisor'),
  dataApprovalController.getMySubmissions
);

// --- Admin-only routes below ---

// GET /api/data-approval/pending — list pending data requests
router.get('/pending', requireRole('admin'), dataApprovalController.getPending);

// GET /api/data-approval/all — list all data requests
router.get('/all', requireRole('admin'), dataApprovalController.getAll);

// GET /api/data-approval/stats — get approval statistics
router.get('/stats', requireRole('admin'), dataApprovalController.getStats);

// POST /api/data-approval/:requestId/approve — approve data
router.post('/:requestId/approve', requireRole('admin'), dataApprovalController.approve);

// POST /api/data-approval/:requestId/reject — reject data
router.post('/:requestId/reject', requireRole('admin'), dataApprovalController.reject);

export default router;
