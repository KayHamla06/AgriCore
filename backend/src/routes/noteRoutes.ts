// ============================================
// AgriCore — Note Routes
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { noteController } from '../controllers/noteController';
import { authMiddleware, validate } from '../middleware';

const router = Router();

const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(10000),
  tags: z.array(z.string().max(50)).max(10).optional(),
  is_pinned: z.boolean().optional(),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(10000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  is_pinned: z.boolean().optional(),
});

const shareNoteSchema = z.object({
  shared_with: z.array(z.string().uuid()).min(1).max(20),
});

// All routes require authentication
router.use(authMiddleware);

router.get('/', noteController.getAll);
router.post('/', validate(createNoteSchema), noteController.create);
router.get('/:id', noteController.getById);
router.put('/:id', validate(updateNoteSchema), noteController.update);
router.post('/:id/share', validate(shareNoteSchema), noteController.share);
router.delete('/:id', noteController.delete);

export default router;
