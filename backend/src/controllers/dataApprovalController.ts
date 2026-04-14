// ============================================
// AgriCore — Data Approval Controller
// Admin endpoints for reviewing pending data.
// ============================================

import { Request, Response, NextFunction } from 'express';
import { dataApprovalService } from '../services/dataApprovalService';

export class DataApprovalController {
  /**
   * POST /api/data-approval/submit
   * Advisor/field_agent: submit data for admin approval.
   */
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { resource_type, farmer_id, payload } = req.body;

      const allowed = ['livestock', 'crops', 'soil_data', 'support_plans'];
      if (!allowed.includes(resource_type)) {
        res.status(400).json({ success: false, message: 'Invalid resource_type' });
        return;
      }
      if (!farmer_id || !payload || typeof payload !== 'object') {
        res.status(400).json({ success: false, message: 'farmer_id and payload are required' });
        return;
      }

      const request = await dataApprovalService.submitCreate(
        req.user!.id,
        resource_type,
        payload,
        farmer_id
      );
      res.status(201).json({ success: true, data: request });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/data-approval/my-submissions
   * Advisor: get own submissions.
   */
  async getMySubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, resourceType } = req.query;
      const submissions = await dataApprovalService.getAll({
        status: status as string,
        resourceType: resourceType as string,
      });
      // Filter to only this user's submissions
      const mine = (submissions || []).filter((s: any) => s.user_id === req.user!.id);
      res.json({ success: true, data: mine });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/data-approval/pending
   * Admin: get all pending data change requests.
   */
  async getPending(_req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await dataApprovalService.getPending();
      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/data-approval/all
   * Admin: get all data change requests with optional filters.
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, resourceType } = req.query;
      const requests = await dataApprovalService.getAll({
        status: status as string,
        resourceType: resourceType as string,
      });
      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/data-approval/:requestId/approve
   * Admin: approve a pending data change request.
   */
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      const { notes } = req.body;

      await dataApprovalService.approve(requestId, req.user!.id, notes);
      res.json({ success: true, message: 'Data approved and published' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/data-approval/:requestId/reject
   * Admin: reject a pending data change request.
   */
  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      const { notes } = req.body;

      await dataApprovalService.reject(requestId, req.user!.id, notes);
      res.json({ success: true, message: 'Data rejected' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/data-approval/stats
   * Admin: get data approval statistics.
   */
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await dataApprovalService.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

export const dataApprovalController = new DataApprovalController();
