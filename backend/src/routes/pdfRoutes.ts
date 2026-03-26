// ============================================
// AgriCore — PDF Routes
// PDF report generation with access control
// ============================================

import { Router } from 'express';
import { pdfController } from '../controllers/pdfController';
import { authMiddleware, requireRole } from '../middleware';

const router = Router();

router.use(authMiddleware);

// GET /api/pdf/farmer/:farmerId — generate farmer report PDF
// Access: farmer (own data only), government/admin/supervisor (any farmer)
router.get('/farmer/:farmerId', pdfController.getFarmerReport);

// GET /api/pdf/plans/:farmerId — generate plan report PDF
router.get('/plans/:farmerId', pdfController.getPlanReport);

// POST /api/pdf/compare — generate multi-farmer comparison PDF
// Access: government/admin/supervisor only
router.post('/compare', requireRole('government', 'admin', 'supervisor'), pdfController.getComparisonReport);

// POST /api/pdf/export — generate filtered data export PDF
router.post('/export', pdfController.getFilteredExport);

export default router;
