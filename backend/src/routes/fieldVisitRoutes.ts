// ============================================
// AgriCore — Field Visit Routes
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { fieldVisitController } from '../controllers/fieldVisitController';
import { authMiddleware, validate, requireRole, requireVerified } from '../middleware';

const router = Router();

const createVisitSchema = z.object({
  farmer_id: z.string().uuid().optional(),
  location_name: z.string().min(1).max(200),
  gps_lat: z.number().min(-90).max(90).optional(),
  gps_lng: z.number().min(-180).max(180).optional(),
  purpose: z.string().min(1).max(500),
  findings: z.string().max(5000).optional(),
  recommendations: z.string().max(5000).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  visit_date: z.string().datetime().optional(),
});

const updateVisitSchema = z.object({
  findings: z.string().max(5000).optional(),
  recommendations: z.string().max(5000).optional(),
  images: z.array(z.string().url()).max(10).optional(),
});

const shareVisitSchema = z.object({
  shared_with: z.array(z.string().uuid()).min(1).max(20),
});

// All routes require authentication + verified status
router.use(authMiddleware, requireVerified);

// List visits (role-aware)
router.get('/', fieldVisitController.getAll);

// Create visit (field agents, supervisors, government)
router.post(
  '/',
  requireRole('field_agent', 'supervisor', 'government', 'admin'),
  validate(createVisitSchema),
  fieldVisitController.create
);

// Get single visit
router.get('/:id', fieldVisitController.getById);

// Update visit (owner only)
router.put('/:id', validate(updateVisitSchema), fieldVisitController.update);

// Share visit
router.post('/:id/share', validate(shareVisitSchema), fieldVisitController.share);

// Delete visit
router.delete('/:id', fieldVisitController.delete);

export default router;
