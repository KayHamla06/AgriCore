// ============================================
// AgriCore — Task Routes
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { taskController } from '../controllers/taskController';
import { authMiddleware, validate, requireRole } from '../middleware';

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assigned_to: z.string().uuid(),
  department_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  deadline: z.string().datetime().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  deadline: z.string().datetime().nullable().optional(),
});

// All routes require authentication
router.use(authMiddleware);

// Root task list endpoint for backwards compatibility and default task loading
router.get('/', taskController.getMyTasks);

// Get tasks assigned to me
router.get('/assigned', taskController.getMyTasks);

// Get tasks I created
router.get('/created', taskController.getCreatedTasks);

// Get tasks for a department
router.get(
  '/department/:departmentId',
  requireRole('admin', 'supervisor', 'advisor'),
  taskController.getDepartmentTasks
);

// Create task (admin/supervisor/advisor only)
router.post(
  '/',
  requireRole('admin', 'supervisor', 'advisor'),
  validate(createTaskSchema),
  taskController.create
);

// Get single task
router.get('/:id', taskController.getById);

// Update task status (assignee or assigner)
router.patch('/:id/status', validate(updateStatusSchema), taskController.updateStatus);

// Update task details (assigner only)
router.put('/:id', validate(updateTaskSchema), taskController.update);

// Delete task (assigner only)
router.delete('/:id', taskController.delete);

export default router;
