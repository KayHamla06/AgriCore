// ============================================
// AgriCore — Field Visit Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { fieldVisitService } from '../services/fieldVisitService';
import { notificationService } from '../services/notificationService';
import { activityLogService } from '../services/activityLogService';

export class FieldVisitController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const visits = await fieldVisitService.getAll(req.user!.id, req.user!.role);
      res.json({ success: true, data: visits });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const visit = await fieldVisitService.getById(req.params.id, req.user!.id, req.user!.role);
      res.json({ success: true, data: visit });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const visit = await fieldVisitService.create(req.user!.id, req.body);

      await activityLogService.log({
        user_id: req.user!.id,
        action: 'visit_logged',
        resource_type: 'field_visit',
        resource_id: visit.id,
        ip_address: req.ip,
      });

      res.status(201).json({ success: true, data: visit });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const visit = await fieldVisitService.update(req.params.id, req.user!.id, req.body);
      res.json({ success: true, data: visit });
    } catch (err) {
      next(err);
    }
  }

  async share(req: Request, res: Response, next: NextFunction) {
    try {
      const visit = await fieldVisitService.share(req.params.id, req.user!.id, req.body.shared_with);

      // Notify recipients
      for (const userId of req.body.shared_with) {
        await notificationService.create({
          user_id: userId,
          type: 'visit_shared',
          title: 'Field Visit Report Shared',
          body: `A field visit report has been shared with you`,
          link: `/visits/${visit.id}`,
        });
      }

      res.json({ success: true, data: visit });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await fieldVisitService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Visit deleted' });
    } catch (err) {
      next(err);
    }
  }
}

export const fieldVisitController = new FieldVisitController();
