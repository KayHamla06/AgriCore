// ============================================
// AgriCore — Notice Board Service
// Handles CRUD for notices with audience
// targeting, expiry cleanup, and view tracking.
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import type { CreateNoticeRequest, UserRole } from '../models/types';
import { notificationService } from './notificationService';
import logger from '../utils/logger';

export class NoticeService {
  // -----------------------------------------------------------------------
  //  Create notice + targets + fan-out notifications
  // -----------------------------------------------------------------------
  async create(data: CreateNoticeRequest, userId: string, userRole: 'admin' | 'advisor') {
    // 1. Insert notice
    const { data: notice, error } = await supabaseAdmin
      .from('notices')
      .insert({
        title: data.title,
        message: data.message,
        created_by: userId,
        created_by_role: userRole,
        expiry_date: data.expiry_date || null,
        is_pinned: data.is_pinned || false,
        is_active: true,
      })
      .select()
      .single();

    if (error || !notice) {
      logger.error('Notice create failed', { error: error?.message });
      throw new Error('Failed to create notice');
    }

    // 2. Insert targets (default: everyone if empty)
    const targets = data.targets && data.targets.length > 0
      ? data.targets
      : [{ role: null, province: null, district: null, farming_type: null, farmer_scale: null }];

    const targetRows = targets.map(t => ({
      notice_id: notice.id,
      role: t.role || null,
      province: t.province || null,
      district: t.district || null,
      farming_type: t.farming_type || null,
      farmer_scale: t.farmer_scale || null,
    }));

    await supabaseAdmin.from('notice_targets').insert(targetRows);

    // 3. Fan-out notifications to affected users (async, non-blocking)
    this.fanOutNotifications(notice.id, notice.title, targets).catch(err => {
      logger.error('Notice notification fan-out failed', { noticeId: notice.id, error: (err as Error).message });
    });

    return notice;
  }

  // -----------------------------------------------------------------------
  //  Get active notices for a user (filtered by targets)
  // -----------------------------------------------------------------------
  async getActiveForUser(userId: string, userRole: UserRole) {
    // Get user profile info for targeting (province, farming_type, etc.)
    let userProvince: string | null = null;
    let userDistrict: string | null = null;

    if (userRole === 'farmer') {
      const { data: farmer } = await supabaseAdmin
        .from('farmers')
        .select('province, district')
        .eq('user_id', userId)
        .maybeSingle();
      if (farmer) {
        userProvince = farmer.province;
        userDistrict = farmer.district;
      }
    }

    // Fetch all active notices with their targets
    const { data: notices, error } = await supabaseAdmin
      .from('notices')
      .select('*, notice_targets(*)')
      .eq('is_active', true)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !notices) return [];

    // Filter: a notice matches if ANY of its targets match the user
    const now = new Date();
    return notices.filter((n: any) => {
      // Skip expired
      if (n.expiry_date && new Date(n.expiry_date) < now) return false;

      const targets = n.notice_targets || [];
      if (targets.length === 0) return true; // no targets = everyone

      return targets.some((t: any) => {
        if (t.role && t.role !== userRole) return false;
        if (t.province && t.province !== userProvince) return false;
        if (t.district && t.district !== userDistrict) return false;
        // farming_type and farmer_scale are soft filters — skip if user data unavailable
        return true;
      });
    });
  }

  // -----------------------------------------------------------------------
  //  Get all notices (admin/advisor management view)
  // -----------------------------------------------------------------------
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from('notices')
      .select('*, notice_targets(*)')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  }

  // -----------------------------------------------------------------------
  //  Get single notice by ID
  // -----------------------------------------------------------------------
  async getById(noticeId: string) {
    const { data, error } = await supabaseAdmin
      .from('notices')
      .select('*, notice_targets(*)')
      .eq('id', noticeId)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  // -----------------------------------------------------------------------
  //  Delete notice (with permission check)
  // -----------------------------------------------------------------------
  async delete(noticeId: string, userId: string, userRole: UserRole) {
    const notice = await this.getById(noticeId);
    if (!notice) throw new Error('Notice not found');

    // Advisors can only delete their own notices
    if (userRole === 'advisor' && notice.created_by !== userId) {
      throw new Error('FORBIDDEN');
    }

    const { error } = await supabaseAdmin
      .from('notices')
      .delete()
      .eq('id', noticeId);

    if (error) throw new Error('Failed to delete notice');
  }

  // -----------------------------------------------------------------------
  //  Record view
  // -----------------------------------------------------------------------
  async recordView(noticeId: string, userId: string) {
    await supabaseAdmin
      .from('notice_views')
      .upsert({ notice_id: noticeId, user_id: userId }, { onConflict: 'notice_id,user_id' });
  }

  // -----------------------------------------------------------------------
  //  Get view analytics for a notice
  // -----------------------------------------------------------------------
  async getViewStats(noticeId: string) {
    const { count } = await supabaseAdmin
      .from('notice_views')
      .select('id', { count: 'exact', head: true })
      .eq('notice_id', noticeId);

    return { views: count || 0 };
  }

  // -----------------------------------------------------------------------
  //  Cleanup expired notices
  // -----------------------------------------------------------------------
  async cleanupExpired() {
    const { data, error } = await supabaseAdmin
      .from('notices')
      .delete()
      .lt('expiry_date', new Date().toISOString())
      .not('expiry_date', 'is', null)
      .select('id');

    if (error) {
      logger.error('Notice cleanup failed', { error: error.message });
      return 0;
    }
    return data?.length || 0;
  }

  // -----------------------------------------------------------------------
  //  Fan-out notifications to targeted users (internal)
  // -----------------------------------------------------------------------
  private async fanOutNotifications(
    _noticeId: string,
    title: string,
    targets: CreateNoticeRequest['targets'],
  ) {
    // Determine which users to notify
    let query = supabaseAdmin.from('users').select('id, role');

    // If targets specify roles, only fetch those
    const roles = targets.map(t => t.role).filter(Boolean) as string[];
    if (roles.length > 0) {
      query = query.in('role', roles);
    }

    const { data: users } = await query;
    if (!users || users.length === 0) return;

    // Create a notification for each targeted user (batch in chunks)
    const BATCH = 50;
    for (let i = 0; i < users.length; i += BATCH) {
      const batch = users.slice(i, i + BATCH);
      await Promise.all(
        batch.map(u =>
          notificationService.create({
            user_id: u.id,
            type: 'system',
            title: `📢 ${title}`,
            body: 'A new notice has been posted. Check the Notice Board.',
            link: '/dashboard#notices',
          }),
        ),
      );
    }
  }
}

export const noticeService = new NoticeService();
