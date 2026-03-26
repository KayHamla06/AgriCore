// ============================================
// AgriCore — Plan Routes
// Support plans (farmer creates own, gov creates for farmers)
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { planController } from '../controllers/planController';
import {
  authMiddleware,
  requireRole,
  validate,
} from '../middleware';

const router = Router();

router.use(authMiddleware);

const createPlanSchema = z.object({
  farmer_id: z.string().uuid(),
  type: z.string().min(1),
  objectives: z.string().min(1),
  budget: z.number().min(0),
  timeline: z.string().min(1),
  status: z.enum(['Draft', 'Pending', 'Active', 'Completed']).default('Draft'),
  approval_status: z.enum(['Pending', 'Approved', 'Rejected']).nullable().default(null),
});

// GET /api/plans — all plans (gov only)
router.get('/', requireRole('government'), planController.getAll);

// GET /api/plans/mine — farmer's own plans
router.get('/mine', requireRole('farmer'), planController.getMyPlans);

// GET /api/plans/farmer/:farmerId — plans for a specific farmer (gov)
router.get('/farmer/:farmerId', requireRole('government'), planController.getByFarmerId);

// POST /api/plans — create a plan
router.post('/', validate(createPlanSchema), planController.create);

// PUT /api/plans/:planId — update a plan
router.put('/:planId', planController.update);

// POST /api/plans/:planId/approve — approve (gov only)
router.post('/:planId/approve', requireRole('government'), planController.approve);

// POST /api/plans/:planId/reject — reject (gov only)
router.post('/:planId/reject', requireRole('government'), planController.reject);

// DELETE /api/plans/:planId — delete a draft plan
router.delete('/:planId', planController.delete);

export default router;
