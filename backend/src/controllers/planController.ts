// ============================================
// AgriCore — Plan Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { planService } from '../services/planService';
import { supabaseAdmin } from '../config/supabaseClient';

export class PlanController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await planService.getAll();
      res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  }

  async getMyPlans(req: Request, res: Response, next: NextFunction) {
    try {
      // Resolve farmer profile ID from auth user ID
      const { data: farmer } = await supabaseAdmin
        .from('farmers')
        .select('id')
        .eq('user_id', req.user!.id)
        .maybeSingle();

      if (!farmer) {
        res.json({ success: true, data: [] });
        return;
      }

      const role = req.query.createdByRole as string | undefined;
      const plans = await planService.getByFarmerId(
        farmer.id,
        role === 'farmer' || role === 'advisor' ? role : undefined
      );
      res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  }

  async getByFarmerId(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await planService.getByFarmerId(req.params.farmerId);
      res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await planService.create({
        ...req.body,
        created_by: req.user!.id,
        created_by_role: req.user!.role,
      });
      res.status(201).json({ success: true, data: plan, message: 'Plan created' });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await planService.update(req.params.planId, req.body);
      res.json({ success: true, data: plan, message: 'Plan updated' });
    } catch (err) {
      next(err);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await planService.approve(req.params.planId);
      res.json({ success: true, data: plan, message: 'Plan approved' });
    } catch (err) {
      next(err);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await planService.reject(req.params.planId);
      res.json({ success: true, data: plan, message: 'Plan rejected' });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await planService.delete(req.params.planId, req.user!.id);
      res.json({ success: true, message: 'Plan deleted' });
    } catch (err) {
      next(err);
    }
  }
}

export const planController = new PlanController();
