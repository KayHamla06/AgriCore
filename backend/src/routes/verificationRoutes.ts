// ============================================
// AgriCore — Verification Routes
// Handles verification document management
// and admin review endpoints.
// ============================================

import { Router } from 'express';
import multer from 'multer';
import { verificationController } from '../controllers/verificationController';
import { authMiddleware, requireRole } from '../middleware';

const router = Router();

// Multer config for verification document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.use(authMiddleware);

// ─── User Endpoints ──────────────────────────

// POST /api/verification/upload — upload a verification document
router.post('/upload', upload.single('file'), verificationController.uploadDocument);

// GET /api/verification/my-documents — list own verification documents
router.get('/my-documents', verificationController.getMyDocuments);

// GET /api/verification/status — get own verification status
router.get('/status', verificationController.getStatus);

// ─── Admin Endpoints ─────────────────────────

// GET /api/verification/pending — list pending verification requests
router.get('/pending', requireRole('admin'), verificationController.getPending);

// GET /api/verification/all — list all verification requests
router.get('/all', requireRole('admin'), verificationController.getAll);

// POST /api/verification/:userId/approve — approve a user
router.post('/:userId/approve', requireRole('admin'), verificationController.approveUser);

// POST /api/verification/:userId/reject — reject a user
router.post('/:userId/reject', requireRole('admin'), verificationController.rejectUser);

export default router;
