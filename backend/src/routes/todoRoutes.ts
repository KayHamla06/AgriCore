// ============================================
// AgriCore — Todo Routes
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { todoController } from '../controllers/todoController';
import { authMiddleware, validate } from '../middleware';

const router = Router();

const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  due_date: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  due_date: z.string().datetime().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

// All routes require authentication (private to user)
router.use(authMiddleware);

// Get all todos
router.get('/', todoController.getAll);

// Get todos by date range
router.get('/range', todoController.getByDate);

// Create todo
router.post('/', validate(createTodoSchema), todoController.create);

// Toggle complete
router.patch('/:id/toggle', todoController.toggleComplete);

// Update todo
router.put('/:id', validate(updateTodoSchema), todoController.update);

// Delete todo
router.delete('/:id', todoController.delete);

export default router;
