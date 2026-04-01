// ============================================
// AgriCore — Upload Routes
// File uploads (images, documents)
// ============================================

import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/uploadController';
import { authMiddleware, requireOwnerOrGov, requireVerified } from '../middleware';

const router = Router();

// Multer config — store in memory buffer for Supabase upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.use(authMiddleware, requireVerified);

// POST /api/upload/:farmerId/farm-image
router.post(
  '/:farmerId/farm-image',
  requireOwnerOrGov,
  upload.single('file'),
  uploadController.uploadFarmImage
);

// POST /api/upload/:farmerId/id-document
router.post(
  '/:farmerId/id-document',
  requireOwnerOrGov,
  upload.single('file'),
  uploadController.uploadIdDocument
);

// POST /api/upload/:farmerId/profile-image
router.post(
  '/:farmerId/profile-image',
  requireOwnerOrGov,
  upload.single('file'),
  uploadController.uploadProfileImage
);

export default router;
