// ============================================
// AgriCore — Chat Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chatService';
import { notificationService } from '../services/notificationService';

export class ChatController {
  async getRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const rooms = await chatService.getRooms(req.user!.id);
      res.json({ success: true, data: rooms });
    } catch (err) {
      next(err);
    }
  }

  async createDirectMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await chatService.createDirectMessage(req.user!.id, req.body.user_id);
      res.status(201).json({ success: true, data: room });
    } catch (err) {
      next(err);
    }
  }

  async createGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await chatService.createGroupChat(
        req.user!.id,
        req.body.name,
        req.body.member_ids,
        req.body.department_id
      );
      res.status(201).json({ success: true, data: room });
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const before = req.query.before as string | undefined;
      const messages = await chatService.getMessages(req.params.roomId, req.user!.id, limit, before);
      res.json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await chatService.sendMessage(
        req.params.roomId,
        req.user!.id,
        req.body.content
      );

      // Notify other members (non-blocking)
      const { supabaseAdmin } = await import('../config/supabaseClient');
      const { data: members } = await supabaseAdmin
        .from('chat_members')
        .select('user_id')
        .eq('room_id', req.params.roomId)
        .neq('user_id', req.user!.id);

      if (members) {
        for (const member of members) {
          await notificationService.create({
            user_id: member.user_id,
            type: 'message_received',
            title: 'New Message',
            body: req.body.content.substring(0, 100),
            link: `/chat/${req.params.roomId}`,
          });
        }
      }

      res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  }
}

export const chatController = new ChatController();
