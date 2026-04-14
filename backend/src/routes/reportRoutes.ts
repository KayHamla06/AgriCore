// ============================================
// AgriCore — Puppeteer PDF Routes
// Isolated route module for Puppeteer-rendered
// PDF reports. Mounted separately from /api/pdf.
// ============================================

import { Router } from 'express';
import { puppeteerPdfController } from '../controllers/puppeteerPdfController';
import { authMiddleware } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/reports/farmer/:farmerId — branded Puppeteer PDF report
router.get('/farmer/:farmerId', puppeteerPdfController.getFarmerReport);

export default router;
