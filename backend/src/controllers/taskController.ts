// ============================================
// AgriCore — Task Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService';
import { notificationService } from '../services/notificationService';
import { activityLogService } from '../services/activityLogService';
import type { TaskStatus } from '../models/types';

export class TaskController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.create({
        ...req.body,
        assigned_by: req.user!.id,
      });

      // Notify assignee
      await notificationService.create({
        user_id: task.assigned_to,
        type: 'task_assigned',
        title: 'New Task Assigned',
        body: `"${task.title}" — due ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'no deadline'}`,
        link: `/tasks/${task.id}`,
      });

      await activityLogService.log({
        user_id: req.user!.id,
        action: 'task_created',
        resource_type: 'task',
        resource_id: task.id,
        ip_address: req.ip,
      });

      res.status(201).json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }

  async getMyTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as TaskStatus | undefined;
      const tasks = await taskService.getAssignedTo(req.user!.id, status);
      res.json({ success: true, data: tasks });
    } catch (err) {
      next(err);
    }
  }

  async getCreatedTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as TaskStatus | undefined;
      const tasks = await taskService.getAssignedBy(req.user!.id, status);
      res.json({ success: true, data: tasks });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.getById(req.params.id);
      res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.updateStatus(
        req.params.id,
        req.user!.id,
        req.body.status
      );

      // Notify assigner when task is completed
      if (req.body.status === 'completed') {
        await notificationService.create({
          user_id: task.assigned_by,
          type: 'task_completed',
          title: 'Task Completed',
          body: `"${task.title}" has been marked as completed`,
          link: `/tasks/${task.id}`,
        });
      }

      await activityLogService.log({
        user_id: req.user!.id,
        action: `task_${req.body.status}`,
        resource_type: 'task',
        resource_id: task.id,
        ip_address: req.ip,
      });

      res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.update(req.params.id, req.user!.id, req.body);
      res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await taskService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Task deleted' });
    } catch (err) {
      next(err);
    }
  }

  async getDepartmentTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as TaskStatus | undefined;
      const tasks = await taskService.getDepartmentTasks(req.params.departmentId, status);
      res.json({ success: true, data: tasks });
    } catch (err) {
      next(err);
    }
  }
}

export const taskController = new TaskController();
