// ============================================
// AgriCore — Activity Log Service
// Audit trail for all user actions
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class ActivityLogService {
  /**
   * Record an activity. Non-blocking — failures are logged, not thrown.
   */
  async log(data: {
    user_id: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    details?: Record<string, unknown>;
    ip_address?: string;
  }) {
    const { error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: data.user_id,
        action: data.action,
        resource_type: data.resource_type,
        resource_id: data.resource_id || null,
        details: data.details || null,
        ip_address: data.ip_address || null,
      });

    if (error) {
      // Don't throw — audit log failure shouldn't break the app
      logger.error('Activity log insert failed', { error: error.message });
    }
  }

  /**
   * Get activity logs (admin only).
   */
  async getAll(filters?: {
    user_id?: string;
    resource_type?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    let query = supabaseAdmin
      .from('activity_logs')
      .select('*, user:users!activity_logs_user_id_fkey(name, email, role)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.user_id) query = query.eq('user_id', filters.user_id);
    if (filters?.resource_type) query = query.eq('resource_type', filters.resource_type);

    const { data, error, count } = await query;
    if (error) throw new AppError('Failed to fetch activity logs', 500);

    return { data: data || [], total: count || 0 };
  }
}

export const activityLogService = new ActivityLogService();
