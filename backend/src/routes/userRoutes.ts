// ============================================
// AgriCore — User Routes
// Account management, settings, deletion,
// profile image upload, address update
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { userController } from '../controllers/userController';
import { authMiddleware, validate } from '../middleware';
import { supabaseAdmin } from '../config/supabaseClient';

const router = Router();

// Multer config for profile image upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

router.use(authMiddleware);

// Middleware to check if user has edit permission (admin-controlled)
async function checkEditPermission(req: Request, res: Response, next: NextFunction) {
  try {
    const { data } = await supabaseAdmin
      .from('profile_permissions')
      .select('can_edit_profile')
      .eq('user_id', req.user!.id)
      .maybeSingle();

    // If no record exists, allow edits by default
    if (data && data.can_edit_profile === false) {
      res.status(403).json({
        success: false,
        error: 'Profile editing is currently disabled. Contact your admin to enable it.',
      });
      return;
    }
    next();
  } catch {
    next(); // On error, allow (fail-open for usability)
  }
}

const updateSettingsSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
});

const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const updateNotificationSettingsSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  in_app: z.boolean().optional(),
  ticket_updates: z.boolean().optional(),
  marketing: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const updateAddressSchema = z.object({
  address_number: z.string().min(1, 'Address number is required').max(20),
  street_name: z.string().min(1, 'Street name is required').max(200),
  suburb: z.string().min(1, 'Suburb is required').max(100),
  town: z.string().min(1, 'Town is required').max(100),
  province: z.string().min(1, 'Province is required').max(100),
  postal_code: z.string().min(1, 'Postal code is required').max(10).regex(/^\d+$/, 'Postal code must be numeric'),
});

// GET /api/user/profile — get current user profile
router.get('/profile', userController.getProfile);

// PUT /api/user/settings — update settings (requires edit permission)
router.put('/settings', checkEditPermission, validate(updateSettingsSchema), userController.updateSettings);

// PUT /api/user/profile — full profile settings sync endpoint
router.put('/profile', checkEditPermission, validate(updateSettingsSchema), userController.updateProfile);

// PUT /api/user/location — user location sync
router.put('/location', checkEditPermission, validate(updateLocationSchema), userController.updateLocation);

// PUT /api/user/password — change password
router.put('/password', validate(changePasswordSchema), userController.changePassword);

// PUT /api/user/security — security settings sync endpoint (password for now)
router.put('/security', validate(changePasswordSchema), userController.updateSecurity);

// PUT /api/user/notification-settings — persist in users.notification_settings
router.put('/notification-settings', validate(updateNotificationSettingsSchema), userController.updateNotificationSettings);

// POST /api/user/profile-image — upload profile image (requires edit permission)
router.post('/profile-image', checkEditPermission, upload.single('file'), userController.uploadProfileImage);

// PUT /api/user/address — update structured address (requires edit permission)
router.put('/address', checkEditPermission, validate(updateAddressSchema), userController.updateAddress);

// Deletion request schema — requires password confirmation
const deletionRequestSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  reason: z.string().max(1000).optional(),
  deletion_reason: z.string().max(200).optional(),
});

// POST /api/user/delete-request — request account deletion (admin approval needed)
router.post('/delete-request', validate(deletionRequestSchema), userController.requestDeletion);

// GET /api/user/delete-request — check deletion request status
router.get('/delete-request', userController.getDeletionStatus);

// GET /api/user/edit-permission — check if user can edit their profile
router.get('/edit-permission', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data } = await supabaseAdmin
      .from('profile_permissions')
      .select('can_edit_profile, notes')
      .eq('user_id', req.user!.id)
      .maybeSingle();

    res.json({
      success: true,
      data: data || { can_edit_profile: true, notes: null },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
