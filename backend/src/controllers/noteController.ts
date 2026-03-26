// ============================================
// AgriCore — Note Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { noteService } from '../services/noteService';
import { notificationService } from '../services/notificationService';

export class NoteController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const notes = await noteService.getAll(req.user!.id);
      res.json({ success: true, data: notes });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const note = await noteService.getById(req.params.id, req.user!.id);
      res.json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const note = await noteService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const note = await noteService.update(req.params.id, req.user!.id, req.body);
      res.json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }

  async share(req: Request, res: Response, next: NextFunction) {
    try {
      const note = await noteService.share(req.params.id, req.user!.id, req.body.shared_with);

      // Notify each shared user
      for (const userId of req.body.shared_with) {
        await notificationService.create({
          user_id: userId,
          type: 'note_shared',
          title: 'Note Shared With You',
          body: `"${note.title}" was shared with you`,
          link: `/notes/${note.id}`,
        });
      }

      res.json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await noteService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Note deleted' });
    } catch (err) {
      next(err);
    }
  }
}

export const noteController = new NoteController();
