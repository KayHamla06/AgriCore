// ============================================
// AgriCore — Department Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { departmentService } from '../services/departmentService';

export class DepartmentController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const departments = await departmentService.getAll();
      res.json({ success: true, data: departments });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.getById(req.params.id);
      res.json({ success: true, data: department });
    } catch (err) {
      next(err);
    }
  }

  async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const members = await departmentService.getMembers(req.params.id);
      res.json({ success: true, data: members });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.create(req.body.name, req.body.description);
      res.status(201).json({ success: true, data: department });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.update(req.params.id, req.body);
      res.json({ success: true, data: department });
    } catch (err) {
      next(err);
    }
  }

  async assignUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await departmentService.assignUser(req.body.user_id, req.params.id);
      res.json({ success: true, data: user, message: 'User assigned to department' });
    } catch (err) {
      next(err);
    }
  }
}

export const departmentController = new DepartmentController();
