// ============================================
// AgriCore — User Controller
// Account management, settings, deletion
// ============================================

import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { supabaseAdmin } from '../config/supabaseClient';
import { notificationService } from '../services/notificationService';
import { activityLogService } from '../services/activityLogService';

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await userService.getProfile(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await userService.updateSettings(req.user!.id, req.body);
      res.json({ success: true, data: updated, message: 'Settings updated' });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await userService.updateProfile(req.user!.id, req.body);
      res.json({ success: true, data: updated, message: 'Profile updated' });
    } catch (err) {
      next(err);
    }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await userService.updateLocation(req.user!.id, req.body);
      res.json({ success: true, data: updated, message: 'Location updated' });
    } catch (err) {
      next(err);
    }
  }

  async updateSecurity(req: Request, res: Response, next: NextFunction) {
    try {
      const { data } = await supabaseAdmin
        .from('users')
        .select('auth_id')
        .eq('id', req.user!.id)
        .maybeSingle();

      if (!data) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      await userService.changePassword(data.auth_id, req.body.newPassword);
      res.json({ success: true, message: 'Security settings updated' });
    } catch (err) {
      next(err);
    }
  }

  async updateNotificationSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await userService.updateNotificationSettings(req.user!.id, req.body || {});
      res.json({ success: true, data: updated, message: 'Notification settings updated' });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { data } = await supabaseAdmin
        .from('users')
        .select('auth_id')
        .eq('id', req.user!.id)
        .maybeSingle();

      if (!data) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      await userService.changePassword(data.auth_id, req.body.newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Request account deletion — creates a pending request for admin approval.
   * Requires password confirmation and a structured reason.
   * Does NOT delete immediately.
   */
  async requestDeletion(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason, deletion_reason, password } = req.body;

      // Require password confirmation for security
      if (!password) {
        res.status(400).json({
          success: false,
          error: 'Password confirmation is required to request account deletion.',
        });
        return;
      }

      // Verify password via Supabase Auth
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', req.user!.id)
        .maybeSingle();

      if (!userData) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAuth = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_ANON_KEY || ''
      );
      const { error: authError } = await supabaseAuth.auth.signInWithPassword({
        email: userData.email,
        password,
      });

      if (authError) {
        res.status(401).json({
          success: false,
          error: 'Incorrect password. Please try again.',
        });
        return;
      }

      // Check if user already has a pending request
      const { data: existing } = await supabaseAdmin
        .from('deletion_requests')
        .select('id, status')
        .eq('user_id', req.user!.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        res.status(409).json({
          success: false,
          error: 'You already have a pending deletion request.',
        });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from('deletion_requests')
        .insert({
          user_id: req.user!.id,
          reason: reason || deletion_reason || '',
          deletion_reason: deletion_reason || reason || '',
        })
        .select()
        .maybeSingle();

      if (error) {
        res.status(500).json({ success: false, error: 'Failed to create deletion request' });
        return;
      }

      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'admin');

      if (admins) {
        for (const admin of admins) {
          await notificationService.create({
            user_id: admin.id,
            type: 'system',
            title: 'New Deletion Request',
            body: 'A user submitted an account deletion request and is awaiting admin review.',
          });
        }
      }

      await activityLogService.log({
        user_id: req.user!.id,
        action: 'request_account_deletion',
        resource_type: 'deletion_request',
        resource_id: data.id,
        details: { reason: deletion_reason || reason || null },
      });

      res.status(201).json({
        success: true,
        data,
        message: 'Your deletion request has been sent to the admin. You will be notified once your account is deleted.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get the current user's deletion request status.
   */
  async getDeletionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, error } = await supabaseAdmin
        .from('deletion_requests')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch deletion status' });
        return;
      }

      res.json({ success: true, data: data || [] });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upload profile image for the authenticated user.
   */
  async uploadProfileImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file provided' });
        return;
      }

      const url = await userService.uploadProfileImage(req.user!.id, req.file);
      res.status(201).json({ success: true, data: { url }, message: 'Profile image uploaded' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update address for the authenticated user.
   */
  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await userService.updateAddress(req.user!.id, req.body);
      res.json({ success: true, data: updated, message: 'Address updated' });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
