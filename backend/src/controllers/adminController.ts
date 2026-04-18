// ============================================
// AgriCore — Admin Controller
// Handles admin dashboard API endpoints
// ============================================

import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService';

export class AdminController {
  // ==========================================
  //  DELETION REQUESTS
  // ==========================================

  async getDeletionRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const requests = await adminService.getDeletionRequests(status as any);
      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  }

  async getDeletionRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await adminService.getDeletionRequest(req.params.id);
      res.json({ success: true, data: request });
    } catch (err) {
      next(err);
    }
  }

  async approveDeletion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.approveDeletion(
        req.params.id,
        req.user!.id,
        req.body.admin_notes
      );
      res.json({
        success: true,
        data: result,
        message: 'Deletion request approved. Account has been removed.',
      });
    } catch (err) {
      next(err);
    }
  }

  async rejectDeletion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.rejectDeletion(
        req.params.id,
        req.user!.id,
        req.body.admin_notes
      );
      res.json({
        success: true,
        data: result,
        message: 'Deletion request rejected.',
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  //  USER MANAGEMENT
  // ==========================================

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role as string | undefined;
      const users = await adminService.getUsers(role);
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  async getUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await adminService.getUserDetails(req.params.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async updateUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.updateUserProfile(
        req.user!.id,
        req.params.id,
        req.body.updates,
        req.body.reason
      );
      res.json({ success: true, data: result, message: 'User profile updated.' });
    } catch (err) {
      next(err);
    }
  }

  async getUserLoginActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activity = await adminService.getUserLoginActivity(req.params.id, limit);
      res.json({ success: true, data: activity });
    } catch (err) {
      next(err);
    }
  }

  async getUserFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const files = await adminService.getUserFiles(req.params.id);
      res.json({ success: true, data: files });
    } catch (err) {
      next(err);
    }
  }

  async getProfilePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const perm = await adminService.getProfilePermission(req.params.id);
      res.json({ success: true, data: perm || { can_edit_profile: true } });
    } catch (err) {
      next(err);
    }
  }

  async setProfilePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.setProfilePermission(
        req.user!.id,
        req.params.id,
        req.body.can_edit_profile,
        req.body.notes
      );
      res.json({ success: true, data: result, message: 'Permission updated.' });
    } catch (err) {
      next(err);
    }
  }

  async getProfileEditHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await adminService.getProfileEditHistory(req.params.id);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  //  STATISTICS
  // ==========================================

  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  //  RECENT LOGIN ACTIVITY
  // ==========================================

  async getRecentLogins(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const logins = await adminService.getRecentLogins(limit);
      res.json({ success: true, data: logins });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  //  ACCOUNT SUSPENSION
  // ==========================================

  async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.suspendUser(
        req.user!.id,
        req.params.id,
        req.body.reason
      );
      res.json({ success: true, data: result, message: 'User has been suspended.' });
    } catch (err) {
      next(err);
    }
  }

  async unsuspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.unsuspendUser(
        req.user!.id,
        req.params.id
      );
      res.json({ success: true, data: result, message: 'User has been reactivated.' });
    } catch (err) {
      next(err);
    }
  }

  async getSuspensionLog(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await adminService.getSuspensionLog(req.params.id);
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
