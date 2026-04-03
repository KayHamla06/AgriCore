// ============================================
// AgriCore — Ticket / Support Service
// CRUD for support tickets with admin management
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { notificationService } from './notificationService';
import { activityLogService } from './activityLogService';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import type { Ticket, TicketStatus } from '../models/types';

export class TicketService {
  /**
   * Create a new support ticket.
   */
  async create(
    userId: string,
    data: { title: string; description: string; type: string; urgency: string },
    file?: Express.Multer.File
  ): Promise<Ticket> {
    let attachmentUrl: string | null = null;
    let attachmentPath: string | null = null;

    // Handle optional file attachment
    if (file) {
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
      const MAX_SIZE = 10 * 1024 * 1024;

      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        throw new AppError('Invalid file type. Only JPG, PNG, PDF, and TXT allowed.', 400);
      }
      if (file.size > MAX_SIZE) {
        throw new AppError('File too large. Maximum 10 MB.', 400);
      }

      const ext = path.extname(file.originalname);
      const filePath = `tickets/${userId}/${uuidv4()}${ext}`;

      const { error: uploadErr } = await supabaseAdmin.storage
        .from(config.storageBucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadErr) {
        logger.error('Ticket attachment upload failed', { userId, error: uploadErr.message });
        throw new AppError('Failed to upload attachment', 500);
      }

      const { data: urlData } = supabaseAdmin.storage
        .from(config.storageBucket)
        .getPublicUrl(filePath);

      attachmentUrl = urlData.publicUrl;
      attachmentPath = filePath;
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description,
        type: data.type,
        urgency: data.urgency,
        attachment_url: attachmentUrl,
        attachment_path: attachmentPath,
      })
      .select()
      .maybeSingle();

    if (error) {
      logger.error('Ticket creation failed', { error: error.message });
      throw new AppError('Failed to create ticket', 500);
    }

    // Notify admins
    await this.notifyAdmins(
      'ticket_created',
      'New Support Ticket',
      `A new ${data.type.replace('_', ' ')} ticket has been submitted (${data.urgency} urgency).`
    );

    await activityLogService.log({
      user_id: userId,
      action: 'create_ticket',
      resource_type: 'ticket',
      resource_id: ticket.id,
      details: { type: data.type, urgency: data.urgency },
    });

    return ticket as Ticket;
  }

  /**
   * Get tickets for a specific user (own tickets only).
   */
  async getByUser(userId: string): Promise<Ticket[]> {
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch tickets', 500);
    return (data || []) as Ticket[];
  }

  /**
   * Admin: get all tickets with optional filters.
   */
  async getAll(filters?: {
    status?: string;
    type?: string;
    urgency?: string;
  }): Promise<any[]> {
    let query = supabaseAdmin
      .from('tickets')
      .select('*, users!tickets_user_id_fkey(name, email, role)')
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.urgency) query = query.eq('urgency', filters.urgency);

    const { data, error } = await query;

    if (error) {
      // Fallback without join
      let fallbackQuery = supabaseAdmin
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) fallbackQuery = fallbackQuery.eq('status', filters.status);
      if (filters?.type) fallbackQuery = fallbackQuery.eq('type', filters.type);
      if (filters?.urgency) fallbackQuery = fallbackQuery.eq('urgency', filters.urgency);

      const { data: fb, error: fbErr } = await fallbackQuery;
      if (fbErr) throw new AppError('Failed to fetch tickets', 500);
      return fb || [];
    }

    return data || [];
  }

  /**
   * Admin: update a ticket (status, admin_notes).
   */
  async update(
    ticketId: string,
    adminId: string,
    updates: { status?: TicketStatus; admin_notes?: string }
  ): Promise<Ticket> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.status) updatePayload.status = updates.status;
    if (updates.admin_notes !== undefined) updatePayload.admin_notes = updates.admin_notes;

    if (updates.status === 'resolved') {
      updatePayload.resolved_by = adminId;
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .update(updatePayload)
      .eq('id', ticketId)
      .select()
      .maybeSingle();

    if (error || !ticket) throw new AppError('Failed to update ticket', 500);

    // Notify the ticket owner
    const notifType = updates.status === 'resolved' ? 'ticket_resolved' : 'ticket_updated';
    const notifTitle = updates.status === 'resolved' ? 'Ticket Resolved' : 'Ticket Updated';
    const notifBody = updates.status === 'resolved'
      ? `Your ticket "${ticket.title}" has been resolved.`
      : `Your ticket "${ticket.title}" has been updated to: ${updates.status || 'updated'}.`;

    await notificationService.create({
      user_id: ticket.user_id,
      type: notifType as any,
      title: notifTitle,
      body: notifBody,
    });

    await activityLogService.log({
      user_id: adminId,
      action: 'update_ticket',
      resource_type: 'ticket',
      resource_id: ticketId,
      details: updates,
    });

    return ticket as Ticket;
  }

  /**
   * Get ticket stats for admin dashboard.
   */
  async getStats(): Promise<{ open: number; inProgress: number; resolved: number; total: number }> {
    const { count: open } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    const { count: inProgress } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    const { count: resolved } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved');

    return {
      open: open || 0,
      inProgress: inProgress || 0,
      resolved: resolved || 0,
      total: (open || 0) + (inProgress || 0) + (resolved || 0),
    };
  }

  private async notifyAdmins(type: string, title: string, body: string): Promise<void> {
    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (admins) {
      for (const admin of admins) {
        await notificationService.create({
          user_id: admin.id,
          type: type as any,
          title,
          body,
        });
      }
    }
  }
}

export const ticketService = new TicketService();
