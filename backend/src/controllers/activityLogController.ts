// ============================================
// AgriCore — Activity Log Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { activityLogService } from '../services/activityLogService';

export class ActivityLogController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id, resource_type, limit, offset } = req.query as Record<string, string>;
      const result = await activityLogService.getAll({
        user_id,
        resource_type,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });
      res.json({ success: true, data: result.data, total: result.total });
    } catch (err) {
      next(err);
    }
  }
}

export const activityLogController = new ActivityLogController();
