// ============================================
// AgriCore — Department Routes
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { departmentController } from '../controllers/departmentController';
import { authMiddleware, validate, requireRole } from '../middleware';

const router = Router();

const createDeptSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateDeptSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

const assignUserSchema = z.object({
  user_id: z.string().uuid(),
});

// All routes require authentication
router.use(authMiddleware);

// List all departments (any authenticated user)
router.get('/', departmentController.getAll);

// Get single department
router.get('/:id', departmentController.getById);

// Get department members
router.get('/:id/members', departmentController.getMembers);

// Admin-only: create, update, assign users
router.post(
  '/',
  requireRole('admin'),
  validate(createDeptSchema),
  departmentController.create
);

router.put(
  '/:id',
  requireRole('admin'),
  validate(updateDeptSchema),
  departmentController.update
);

router.post(
  '/:id/assign',
  requireRole('admin', 'supervisor'),
  validate(assignUserSchema),
  departmentController.assignUser
);

export default router;
