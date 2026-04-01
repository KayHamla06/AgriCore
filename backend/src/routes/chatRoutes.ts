// ============================================
// AgriCore — Chat Routes
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { chatController } from '../controllers/chatController';
import { authMiddleware, validate, requireVerified } from '../middleware';

const router = Router();

const createDMSchema = z.object({
  user_id: z.string().uuid(),
});

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  member_ids: z.array(z.string().uuid()).min(1).max(50),
  department_id: z.string().uuid().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

// All routes require authentication + verified status
router.use(authMiddleware, requireVerified);

// Get my chat rooms
router.get('/rooms', chatController.getRooms);

// Create direct message
router.post('/dm', validate(createDMSchema), chatController.createDirectMessage);

// Create group chat
router.post('/group', validate(createGroupSchema), chatController.createGroup);

// Get messages for a room (paginated)
router.get('/rooms/:roomId/messages', chatController.getMessages);

// Send message to a room
router.post(
  '/rooms/:roomId/messages',
  validate(sendMessageSchema),
  chatController.sendMessage
);

export default router;
