// ============================================
// AgriCore — Todo Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { todoService } from '../services/todoService';

export class TodoController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const includeCompleted = req.query.include_completed === 'true';
      const todos = await todoService.getAll(req.user!.id, includeCompleted);
      res.json({ success: true, data: todos });
    } catch (err) {
      next(err);
    }
  }

  async getByDate(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = req.query as { start: string; end: string };
      const todos = await todoService.getByDate(req.user!.id, start, end);
      res.json({ success: true, data: todos });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const todo = await todoService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data: todo });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const todo = await todoService.update(req.params.id, req.user!.id, req.body);
      res.json({ success: true, data: todo });
    } catch (err) {
      next(err);
    }
  }

  async toggleComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const todo = await todoService.toggleComplete(req.params.id, req.user!.id);
      res.json({ success: true, data: todo });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await todoService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Todo deleted' });
    } catch (err) {
      next(err);
    }
  }
}

export const todoController = new TodoController();
