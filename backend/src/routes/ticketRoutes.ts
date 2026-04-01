// ============================================
// AgriCore — Ticket Routes
// Support ticket endpoints with rate limiting
// ============================================

import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { ticketController } from '../controllers/ticketController';
import { authMiddleware, requireRole, requireVerified } from '../middleware';

const router = Router();

// Multer for optional attachment upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Rate limit ticket creation to prevent spam (5 per 15 minutes)
const ticketCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many tickets created. Please wait before submitting another.' },
});

router.use(authMiddleware, requireVerified);

// ─── User Endpoints ──────────────────────────

// POST /api/tickets — create a support ticket
router.post('/', ticketCreateLimiter, upload.single('file'), ticketController.create);

// GET /api/tickets/my — get current user's tickets
router.get('/my', ticketController.getMyTickets);

// ─── Admin Endpoints ─────────────────────────

// PATCH /api/tickets/:id — admin update ticket
router.patch('/:id', requireRole('admin'), ticketController.updateTicket);

export default router;
