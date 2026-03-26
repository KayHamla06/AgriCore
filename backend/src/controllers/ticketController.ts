// ============================================
// AgriCore — Ticket Controller
// Handles support ticket endpoints.
// ============================================

import { Request, Response, NextFunction } from 'express';
import { ticketService } from '../services/ticketService';

export class TicketController {
  /**
   * POST /api/tickets
   * Create a new support ticket.
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, type, urgency } = req.body;

      if (!title || !description || !type) {
        res.status(400).json({ success: false, error: 'Title, description, and type are required' });
        return;
      }

      const ticket = await ticketService.create(
        req.user!.id,
        { title, description, type, urgency: urgency || 'low' },
        req.file
      );

      res.status(201).json({
        success: true,
        data: ticket,
        message: 'Ticket submitted successfully. Our team will review it shortly.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tickets/my
   * Get current user's tickets.
   */
  async getMyTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const tickets = await ticketService.getByUser(req.user!.id);
      res.json({ success: true, data: tickets });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/tickets
   * Admin: get all tickets with optional filters.
   */
  async getAllTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, type, urgency } = req.query;
      const tickets = await ticketService.getAll({
        status: status as string,
        type: type as string,
        urgency: urgency as string,
      });
      res.json({ success: true, data: tickets });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/tickets/:id
   * Admin: update ticket status / notes.
   */
  async updateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, admin_notes } = req.body;

      const ticket = await ticketService.update(id, req.user!.id, {
        status,
        admin_notes,
      });

      res.json({ success: true, data: ticket, message: 'Ticket updated' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/tickets/stats
   * Admin: ticket statistics.
   */
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ticketService.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

export const ticketController = new TicketController();
