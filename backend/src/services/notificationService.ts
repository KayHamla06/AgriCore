// ============================================
// AgriCore — Notification Service
// Push-style notifications for task updates,
// messages, shared reports, etc.
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import type { NotificationType } from '../models/types';
import logger from '../utils/logger';

export class NotificationService {
  async getAll(userId: string, unreadOnly = false) {
    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unreadOnly) query = query.eq('read', false);

    const { data, error } = await query;
    if (error) {
      // Table may not exist yet or other DB issue — return empty instead of crashing
      return [];
    }
    return data || [];
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) return 0;
    return count || 0;
  }

  async create(data: {
    user_id: string;
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
  }) {
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        body: data.body || '',
        link: data.link || null,
      })
      .select()
      .maybeSingle();

    if (error) {
      logger.error('Notification create failed', { type: data.type, userId: data.user_id, error: error.message });
      return null;
    }
    return notification;
  }

  async markRead(notificationId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) return; // Non-critical
  }

  async markAllRead(userId: string) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) return; // Non-critical
  }

  async delete(notificationId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) return; // Non-critical
  }
}

export const notificationService = new NotificationService();
