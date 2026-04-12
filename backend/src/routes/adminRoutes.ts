// ============================================
// AgriCore — Admin Routes
// All routes require admin role
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { adminController } from '../controllers/adminController';
import { adminService } from '../services/adminService';
import { ticketController } from '../controllers/ticketController';
import { authMiddleware, requireRole, validate } from '../middleware';
import { emailVerificationService } from '../services/emailVerificationService';
import logger from '../utils/logger';

const router = Router();

// All admin routes require authentication + admin role
router.use(authMiddleware);
router.use(requireRole('admin'));

// =============================================
//  DELETION REQUESTS
// =============================================

const reviewSchema = z.object({
  admin_notes: z.string().max(1000).optional(),
});

// GET /api/admin/deletions — list all deletion requests (optional ?status=pending)
router.get('/deletions', adminController.getDeletionRequests);

// GET /api/admin/deletions/:id — get single deletion request
router.get('/deletions/:id', adminController.getDeletionRequest);

// POST /api/admin/deletions/:id/approve — approve deletion
router.post(
  '/deletions/:id/approve',
  validate(reviewSchema),
  adminController.approveDeletion
);

// POST /api/admin/deletions/:id/reject — reject deletion
router.post(
  '/deletions/:id/reject',
  validate(reviewSchema),
  adminController.rejectDeletion
);

// =============================================
//  USER MANAGEMENT
// =============================================

// GET /api/admin/users — list all users (optional ?role=farmer)
router.get('/users', adminController.getUsers);

// GET /api/admin/users/:id — get user details
router.get('/users/:id', adminController.getUserDetails);

// PUT /api/admin/users/:id — admin edit user profile
const updateProfileSchema = z.object({
  updates: z.record(z.unknown()),
  reason: z.string().max(500).optional(),
});
router.put('/users/:id', validate(updateProfileSchema), adminController.updateUserProfile);

// GET /api/admin/users/:id/logins — login activity
router.get('/users/:id/logins', adminController.getUserLoginActivity);

// GET /api/admin/users/:id/files — user uploaded files
router.get('/users/:id/files', adminController.getUserFiles);

// GET /api/admin/users/:id/permissions — get profile edit permission
router.get('/users/:id/permissions', adminController.getProfilePermission);

// PUT /api/admin/users/:id/permissions — set profile edit permission
const permissionSchema = z.object({
  can_edit_profile: z.boolean(),
  notes: z.string().max(500).optional(),
});
router.put('/users/:id/permissions', validate(permissionSchema), adminController.setProfilePermission);

// GET /api/admin/users/:id/edit-history — admin edit audit trail
router.get('/users/:id/edit-history', adminController.getProfileEditHistory);

// POST /api/admin/users/:id/send-verification — send verification email to user
router.post('/users/:id/send-verification', async (req, res, next) => {
  try {
    const user = await adminService.getUserDetails(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    await emailVerificationService.sendVerificationEmail(user.email);
    logger.info('Admin sent verification email', { adminId: req.user!.id, targetEmail: user.email });
    res.json({ success: true, message: 'Verification email sent to ' + user.email });
  } catch (err) {
    next(err);
  }
});

// =============================================
//  STATISTICS
// =============================================

// GET /api/admin/stats — dashboard statistics
router.get('/stats', adminController.getStats);

// =============================================
//  TICKETS (ADMIN)
// =============================================

// GET /api/admin/tickets — list all tickets (filters: ?status=open&type=bug&urgency=high)
router.get('/tickets', ticketController.getAllTickets);

// GET /api/admin/tickets/stats — ticket statistics
router.get('/tickets/stats', ticketController.getStats);

export default router;
