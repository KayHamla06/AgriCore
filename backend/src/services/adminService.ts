// ============================================
// AgriCore — Admin Service
// Handles deletion request approval, user
// management, and system statistics.
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import { userService } from './userService';
import { notificationService } from './notificationService';
import { activityLogService } from './activityLogService';
import { loginActivityService } from './loginActivityService';
import { cacheService } from './cacheService';
import logger from '../utils/logger';
import type { DeletionRequest, LoginActivity, ProfilePermission } from '../models/types';

export class AdminService {
  // ==========================================
  //  DELETION REQUESTS
  // ==========================================

  /**
   * Get all deletion requests, optionally filtered by status.
   */
  async getDeletionRequests(status?: DeletionRequest['status']): Promise<DeletionRequest[]> {
    let query = supabaseAdmin
      .from('deletion_requests')
      .select('*, users:user_id(id, email, name, role)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      // Table may not exist yet or other DB issue — return empty instead of crashing
      logger.warn('deletion_requests query failed', { code: error.code, message: error.message });
      return [];
    }
    return data as DeletionRequest[];
  }

  /**
   * Get a single deletion request by ID.
   */
  async getDeletionRequest(requestId: string): Promise<DeletionRequest> {
    const { data, error } = await supabaseAdmin
      .from('deletion_requests')
      .select('*, users:user_id(id, email, name, role)')
      .eq('id', requestId)
      .maybeSingle();

    if (error || !data) throw new AppError('Deletion request not found', 404);
    return data as DeletionRequest;
  }

  /**
   * Approve a deletion request — actually deletes the user's account.
   */
  async approveDeletion(
    requestId: string,
    adminUserId: string,
    adminNotes?: string
  ): Promise<DeletionRequest> {
    // 1. Get the request
    const request = await this.getDeletionRequest(requestId);

    if (request.status !== 'pending') {
      throw new AppError('This request has already been processed', 400);
    }

    // 2. Get user's auth_id for deletion
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('auth_id')
      .eq('id', request.user_id)
      .maybeSingle();

    if (userError || !user) {
      throw new AppError('User associated with this request not found', 404);
    }

    // 3. Mark request as approved
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('deletion_requests')
      .update({
        status: 'approved',
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      })
      .eq('id', requestId)
      .select()
      .maybeSingle();

    if (updateError) throw new AppError('Failed to update deletion request', 500);

    // 4. Notify user before deletion
    await notificationService.create({
      user_id: request.user_id,
      type: 'deletion_approved',
      title: 'Account Deletion Approved',
      body: 'Your account deletion request has been approved. Your account and data will be removed.',
    });

    // 5. Actually delete the account
    try {
      await userService.deleteAccount(request.user_id, user.auth_id);

      await activityLogService.log({
        user_id: adminUserId,
        action: 'approve_deletion',
        resource_type: 'deletion_request',
        resource_id: requestId,
        details: { deleted_user_id: request.user_id, notes: adminNotes },
      });

      logger.info('Admin approved account deletion', {
        requestId,
        userId: request.user_id,
        adminId: adminUserId,
      });
    } catch (err) {
      logger.error('Account deletion failed after approval', { requestId, error: err });
      // Revert the approval status
      await supabaseAdmin
        .from('deletion_requests')
        .update({ status: 'pending', reviewed_by: null, reviewed_at: null })
        .eq('id', requestId);
      throw new AppError('Account deletion failed. Request reverted to pending.', 500);
    }

    cacheService.invalidateAdminStats();
    return updated as DeletionRequest;
  }

  /**
   * Reject a deletion request.
   */
  async rejectDeletion(
    requestId: string,
    adminUserId: string,
    adminNotes?: string
  ): Promise<DeletionRequest> {
    const request = await this.getDeletionRequest(requestId);

    if (request.status !== 'pending') {
      throw new AppError('This request has already been processed', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('deletion_requests')
      .update({
        status: 'rejected',
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      })
      .eq('id', requestId)
      .select()
      .maybeSingle();

    if (error) throw new AppError('Failed to reject deletion request', 500);

    // Notify user their request was rejected
    await notificationService.create({
      user_id: request.user_id,
      type: 'deletion_rejected',
      title: 'Deletion Request Rejected',
      body: adminNotes
        ? `Your account deletion request was rejected: ${adminNotes}`
        : 'Your account deletion request was rejected. Your account remains active.',
    });

    await activityLogService.log({
      user_id: adminUserId,
      action: 'reject_deletion',
      resource_type: 'deletion_request',
      resource_id: requestId,
      details: { rejected_user_id: request.user_id, notes: adminNotes },
    });

    logger.info('Admin rejected deletion request', {
      requestId,
      userId: request.user_id,
      adminId: adminUserId,
    });

    return data as DeletionRequest;
  }

  // ==========================================
  //  USER MANAGEMENT
  // ==========================================

  /**
   * List all users with optional role filter.
   */
  async getUsers(role?: string) {
    let query = supabaseAdmin
      .from('users')
      .select('id, email, name, role, phone, verification_status, created_at')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch users', 500);
    return data;
  }

  /**
   * Get a single user with full details.
   */
  async getUserDetails(userId: string) {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) throw new AppError('User not found', 404);

    // Check if user's email is confirmed in auth.users
    let email_confirmed = true;
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.auth_id);
      email_confirmed = !!authUser?.user?.email_confirmed_at;
    } catch (_) {
      // If we can't check, assume confirmed
    }

    // If farmer, include farmer profile
    if (user.role === 'farmer') {
      const { data: farmer } = await supabaseAdmin
        .from('farmers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      return { ...user, email_confirmed, farmer };
    }

    return { ...user, email_confirmed };
  }

  // ==========================================
  //  SYSTEM STATISTICS
  // ==========================================

  /**
   * Get dashboard statistics for the admin panel.
   */
  async getStats() {
    const cached = cacheService.getAdminStats<{
      totalUsers: number;
      totalFarmers: number;
      totalPlans: number;
      pendingDeletions: number;
      openTickets: number;
    }>();
    if (cached) return cached;

    // Wrap each query in a real Promise so .catch() is available
    const safeCount = (q: PromiseLike<{ count: number | null }>) =>
      Promise.resolve(q).then(r => r.count ?? 0).catch(() => 0);

    const [totalUsers, totalFarmers, totalPlans, pendingDeletions, openTickets] = await Promise.all([
      safeCount(supabaseAdmin.from('users').select('id', { count: 'exact', head: true })),
      safeCount(supabaseAdmin.from('farmers').select('id', { count: 'exact', head: true })),
      safeCount(supabaseAdmin.from('support_plans').select('id', { count: 'exact', head: true })),
      safeCount(supabaseAdmin.from('deletion_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
      safeCount(supabaseAdmin.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open')),
    ]);

    const stats = { totalUsers, totalFarmers, totalPlans, pendingDeletions, openTickets };

    cacheService.setAdminStats(stats);
    return stats;
  }

  // ==========================================
  //  ADMIN EDIT USER PROFILE
  // ==========================================

  /**
   * Admin updates any user's profile fields.
   * Records an audit trail of all changes.
   */
  async updateUserProfile(
    adminId: string,
    targetUserId: string,
    updates: Record<string, unknown>,
    reason?: string
  ) {
    // 1. Fetch current user data for audit
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .maybeSingle();

    if (fetchError || !currentUser) throw new AppError('User not found', 404);

    // 2. Whitelist allowed fields
    const allowedFields = [
      'name', 'phone', 'address_number', 'street_name',
      'suburb', 'town', 'province', 'postal_code', 'role',
    ];
    const sanitized: Record<string, unknown> = {};
    const previousValues: Record<string, unknown> = {};

    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key) && updates[key] !== currentUser[key]) {
        sanitized[key] = updates[key];
        previousValues[key] = currentUser[key];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    // 3. Apply updates
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('users')
      .update(sanitized)
      .eq('id', targetUserId)
      .select()
      .maybeSingle();

    if (updateError) throw new AppError('Failed to update user profile', 500);

    // 4. Record audit trail
    await supabaseAdmin.from('admin_profile_edits').insert({
      admin_id: adminId,
      target_user_id: targetUserId,
      fields_changed: sanitized,
      previous_values: previousValues,
      new_values: sanitized,
      reason: reason || null,
    });

    await activityLogService.log({
      user_id: adminId,
      action: 'admin_edit_profile',
      resource_type: 'user',
      resource_id: targetUserId,
      details: { fields: Object.keys(sanitized), reason },
    });

    logger.info('Admin edited user profile', {
      adminId,
      targetUserId,
      fields: Object.keys(sanitized),
    });

    cacheService.invalidateAdminStats();
    return updated;
  }

  // ==========================================
  //  USER LOGIN ACTIVITY
  // ==========================================

  /**
   * Get login history for a specific user.
   */
  async getUserLoginActivity(userId: string, limit = 50): Promise<LoginActivity[]> {
    return loginActivityService.getByUser(userId, limit);
  }

  /**
   * Get recent login activity across all users (admin overview).
   */
  async getRecentLogins(limit = 20): Promise<LoginActivity[]> {
    return loginActivityService.getRecent(limit);
  }

  // ==========================================
  //  USER FILES / UPLOADS
  // ==========================================

  /**
   * Get all uploaded files for a user (profile image, documents, farm images).
   */
  async getUserFiles(userId: string) {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, profile_image_url')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) throw new AppError('User not found', 404);

    const files: { type: string; url: string }[] = [];

    if (user.profile_image_url) {
      files.push({ type: 'profile_image', url: user.profile_image_url });
    }

    // Get farmer files if applicable
    const { data: farmer } = await supabaseAdmin
      .from('farmers')
      .select('profile_image_url, id_document_url, farm_images')
      .eq('user_id', userId)
      .maybeSingle();

    if (farmer) {
      if (farmer.profile_image_url) {
        files.push({ type: 'farmer_profile_image', url: farmer.profile_image_url });
      }
      if (farmer.id_document_url) {
        files.push({ type: 'id_document', url: farmer.id_document_url });
      }
      if (farmer.farm_images && Array.isArray(farmer.farm_images)) {
        farmer.farm_images.forEach((url: string) => {
          files.push({ type: 'farm_image', url });
        });
      }
    }

    // Get verification documents
    const { data: verDocs } = await supabaseAdmin
      .from('verification_documents')
      .select('document_type, file_url')
      .eq('user_id', userId);

    if (verDocs) {
      verDocs.forEach((doc: { document_type: string; file_url: string }) => {
        files.push({ type: doc.document_type, url: doc.file_url });
      });
    }

    return files;
  }

  // ==========================================
  //  PROFILE EDIT PERMISSIONS
  // ==========================================

  /**
   * Get a user's profile edit permission.
   */
  async getProfilePermission(userId: string): Promise<ProfilePermission | null> {
    const { data } = await supabaseAdmin
      .from('profile_permissions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) return null;
    return data as ProfilePermission;
  }

  /**
   * Set whether a user can edit their own profile.
   */
  async setProfilePermission(
    adminId: string,
    targetUserId: string,
    canEdit: boolean,
    notes?: string
  ): Promise<ProfilePermission> {
    // Upsert the permission
    const { data, error } = await supabaseAdmin
      .from('profile_permissions')
      .upsert(
        {
          user_id: targetUserId,
          can_edit_profile: canEdit,
          granted_by: adminId,
          granted_at: new Date().toISOString(),
          notes: notes || null,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .maybeSingle();

    if (error) throw new AppError('Failed to update profile permission', 500);

    await activityLogService.log({
      user_id: adminId,
      action: canEdit ? 'grant_profile_edit' : 'revoke_profile_edit',
      resource_type: 'user',
      resource_id: targetUserId,
      details: { can_edit: canEdit, notes },
    });

    logger.info('Admin updated profile permission', {
      adminId,
      targetUserId,
      canEdit,
    });

    return data as ProfilePermission;
  }

  /**
   * Get admin edit history for a user.
   */
  async getProfileEditHistory(targetUserId: string) {
    const { data, error } = await supabaseAdmin
      .from('admin_profile_edits')
      .select('*, admin:admin_id(name, email)')
      .eq('target_user_id', targetUserId)
      .order('edited_at', { ascending: false })
      .limit(50);

    if (error) throw new AppError('Failed to fetch edit history', 500);
    return data;
  }
}

export const adminService = new AdminService();
