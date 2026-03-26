// ============================================
// AgriCore — Data Approval Controller
// Admin endpoints for reviewing pending data.
// ============================================

import { Request, Response, NextFunction } from 'express';
import { dataApprovalService } from '../services/dataApprovalService';

export class DataApprovalController {
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
