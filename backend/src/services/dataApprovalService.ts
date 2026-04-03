// ============================================
// AgriCore — Data Approval Service
// Ensures NO farmer data goes live without
// admin approval. Manages data_change_requests.
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import { notificationService } from './notificationService';
import { activityLogService } from './activityLogService';
import logger from '../utils/logger';
import type { DataChangeRequest } from '../models/types';

export class DataApprovalService {
  /**
   * Create a data change request record for admin review.
   * Used when the data row is already inserted with data_status='pending'.
   */
  async submitChangeRequest(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'create' | 'update' | 'delete',
    payload: Record<string, unknown>
  ): Promise<DataChangeRequest> {
    const { data: request, error } = await supabaseAdmin
      .from('data_change_requests')
      .insert({
        user_id: userId,
        resource_type: resourceType,
        resource_id: resourceId,
        action,
        payload,
      })
      .select()
      .maybeSingle();

    if (error) {
      logger.error('Change request insert failed', { error: error.message });
      throw new AppError('Failed to create change request', 500);
    }

    // Notify admins
    await this.notifyAdmins(
      'data_pending',
      'New Data Awaiting Approval',
      `A ${resourceType.replace('_', ' ')} record has been submitted for review.`
    );

    await activityLogService.log({
      user_id: userId,
      action: 'submit_data',
      resource_type: resourceType,
      resource_id: resourceId,
      details: { action },
    });

    return request as DataChangeRequest;
  }

  /**
   * Submit a data change request (create / update / delete).
   * The actual data is inserted with data_status = 'pending',
   * then a data_change_request record is created for admin review.
   */
  async submitCreate(
    userId: string,
    resourceType: 'livestock' | 'crops' | 'soil_data' | 'support_plans',
    payload: Record<string, unknown>,
    farmerId: string
  ): Promise<DataChangeRequest> {
    // Insert the actual row with data_status = 'pending'
    const insertPayload = {
      ...payload,
      farmer_id: farmerId,
      data_status: 'pending',
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from(resourceType)
      .insert(insertPayload)
      .select()
      .maybeSingle();

    if (insertError) {
      logger.error('Data insert failed', { resourceType, error: insertError.message });
      throw new AppError(`Failed to submit ${resourceType} data`, 500);
    }

    // Create the change request
    const { data: request, error: requestError } = await supabaseAdmin
      .from('data_change_requests')
      .insert({
        user_id: userId,
        resource_type: resourceType,
        resource_id: inserted.id,
        action: 'create',
        payload: insertPayload,
      })
      .select()
      .maybeSingle();

    if (requestError) {
      logger.error('Change request insert failed', { error: requestError.message });
      throw new AppError('Failed to create change request', 500);
    }

    // Notify admins
    await this.notifyAdmins(
      'data_pending',
      'New Data Awaiting Approval',
      `A ${resourceType.replace('_', ' ')} record has been submitted for review.`
    );

    await activityLogService.log({
      user_id: userId,
      action: 'submit_data',
      resource_type: resourceType,
      resource_id: inserted.id,
      details: { action: 'create' },
    });

    return request as DataChangeRequest;
  }

  /**
   * Get all pending data change requests (admin).
   */
  async getPending(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('data_change_requests')
      .select('*, users!data_change_requests_user_id_fkey(name, email, role)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback without join if FK name doesn't match
      const { data: fallback, error: fbErr } = await supabaseAdmin
        .from('data_change_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fbErr) throw new AppError('Failed to fetch pending requests', 500);
      return fallback || [];
    }

    return data || [];
  }

  /**
   * Get all data change requests with optional filters (admin).
   */
  async getAll(filters?: {
    status?: string;
    resourceType?: string;
  }): Promise<any[]> {
    let query = supabaseAdmin
      .from('data_change_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.resourceType) {
      query = query.eq('resource_type', filters.resourceType);
    }

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch data change requests', 500);
    return data || [];
  }

  /**
   * Admin: approve a data change request → set data_status = 'approved' on the resource.
   */
  async approve(
    requestId: string,
    adminId: string,
    notes?: string
  ): Promise<void> {
    // Fetch the request
    const { data: request, error: fetchErr } = await supabaseAdmin
      .from('data_change_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchErr || !request) throw new AppError('Change request not found', 404);
    if (request.status !== 'pending') throw new AppError('Request already reviewed', 400);

    // Update the actual data row to approved
    const { error: updateError } = await supabaseAdmin
      .from(request.resource_type)
      .update({ data_status: 'approved' })
      .eq('id', request.resource_id);

    if (updateError) {
      logger.error('Failed to approve data', { requestId, error: updateError.message });
      throw new AppError('Failed to approve data', 500);
    }

    // Mark the request as approved
    await supabaseAdmin
      .from('data_change_requests')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
      })
      .eq('id', requestId);

    // Notify the submitting user
    await notificationService.create({
      user_id: request.user_id,
      type: 'data_approved',
      title: 'Data Approved',
      body: `Your ${request.resource_type.replace('_', ' ')} submission has been approved.`,
    });

    await activityLogService.log({
      user_id: adminId,
      action: 'approve_data',
      resource_type: request.resource_type,
      resource_id: request.resource_id,
      details: { request_id: requestId, notes },
    });

    logger.info('Data approved', { requestId, adminId });
  }

  /**
   * Admin: reject a data change request → set data_status = 'rejected' on the resource.
   */
  async reject(
    requestId: string,
    adminId: string,
    notes?: string
  ): Promise<void> {
    const { data: request, error: fetchErr } = await supabaseAdmin
      .from('data_change_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchErr || !request) throw new AppError('Change request not found', 404);
    if (request.status !== 'pending') throw new AppError('Request already reviewed', 400);

    // Mark the data as rejected
    await supabaseAdmin
      .from(request.resource_type)
      .update({ data_status: 'rejected' })
      .eq('id', request.resource_id);

    // Mark the change request as rejected
    await supabaseAdmin
      .from('data_change_requests')
      .update({
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
      })
      .eq('id', requestId);

    // Notify the submitting user
    await notificationService.create({
      user_id: request.user_id,
      type: 'data_rejected',
      title: 'Data Rejected',
      body: notes
        ? `Your ${request.resource_type.replace('_', ' ')} submission was rejected: ${notes}`
        : `Your ${request.resource_type.replace('_', ' ')} submission was rejected.`,
    });

    await activityLogService.log({
      user_id: adminId,
      action: 'reject_data',
      resource_type: request.resource_type,
      resource_id: request.resource_id,
      details: { request_id: requestId, notes },
    });

    logger.info('Data rejected', { requestId, adminId });
  }

  /**
   * Get counts for admin dashboard stats.
   */
  async getStats(): Promise<{ pendingData: number; approvedData: number; rejectedData: number }> {
    const { count: pendingData } = await supabaseAdmin
      .from('data_change_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: approvedData } = await supabaseAdmin
      .from('data_change_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: rejectedData } = await supabaseAdmin
      .from('data_change_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    return {
      pendingData: pendingData || 0,
      approvedData: approvedData || 0,
      rejectedData: rejectedData || 0,
    };
  }

  /**
   * Notify all admin users.
   */
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

export const dataApprovalService = new DataApprovalService();
