// ============================================
// AgriCore — Verification Service
// Handles user verification workflows:
// document upload, admin review, badge status.
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { notificationService } from './notificationService';
import { activityLogService } from './activityLogService';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import type { VerificationDocument, VerificationStatus } from '../models/types';

export class VerificationService {
  private isMissingRelationError(error: { code?: string; message?: string } | null | undefined): boolean {
    if (!error) return false;

    return error.code === '42P01'
      || error.code === 'PGRST205'
      || /relation .* does not exist/i.test(error.message || '')
      || /could not find the table/i.test(error.message || '');
  }

  private async syncUserVerificationStatus(userId: string, status: VerificationStatus): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ verification_status: status })
      .eq('id', userId);

    if (error) {
      throw new AppError('Failed to update user verification status', 500);
    }
  }

  private async syncVerificationRequests(
    userId: string,
    status: 'pending' | 'approved' | 'rejected',
    adminId?: string,
    notes?: string,
    reviewedAt?: string
  ): Promise<void> {
    const updatePayload: Record<string, unknown> = {
      status,
      reviewed_by: adminId || null,
      review_notes: notes || null,
      reviewed_at: status === 'pending' ? null : (reviewedAt || new Date().toISOString()),
    };

    const { error } = await supabaseAdmin
      .from('verification_requests')
      .update(updatePayload)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error && !this.isMissingRelationError(error)) {
      throw new AppError('Failed to update verification request records', 500);
    }
  }

  private async syncVerificationDocuments(
    userId: string,
    status: 'approved' | 'rejected',
    adminId: string,
    notes?: string,
    reviewedAt?: string
  ): Promise<void> {
    const action = status === 'approved' ? 'approve' : 'reject';

    const { error } = await supabaseAdmin
      .from('verification_documents')
      .update({
        status,
        reviewed_by: adminId,
        reviewed_at: reviewedAt || new Date().toISOString(),
        review_notes: notes || null,
      })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error && !this.isMissingRelationError(error)) {
      throw new AppError(`Failed to ${action} verification documents`, 500);
    }
  }

  private async getDocumentsByUserIds(userIds: string[]): Promise<Map<string, VerificationDocument[]>> {
    const documentsByUserId = new Map<string, VerificationDocument[]>();

    if (userIds.length === 0) {
      return documentsByUserId;
    }

    const { data, error } = await supabaseAdmin
      .from('verification_documents')
      .select('*')
      .in('user_id', userIds)
      .order('uploaded_at', { ascending: false });

    if (error) {
      if (this.isMissingRelationError(error)) {
        logger.warn('verification_documents table missing; returning empty document lists', { userIds });
        return documentsByUserId;
      }

      throw new AppError('Failed to fetch verification documents', 500);
    }

    for (const record of (data || []) as VerificationDocument[]) {
      const bucket = documentsByUserId.get(record.user_id) || [];
      bucket.push(record);
      documentsByUserId.set(record.user_id, bucket);
    }

    return documentsByUserId;
  }

  /**
   * Upload a verification document for a user.
   */
  async uploadDocument(
    userId: string,
    documentType: string,
    file: Express.Multer.File
  ): Promise<VerificationDocument> {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
    const MAX_SIZE = 10 * 1024 * 1024;

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new AppError('Invalid file type. Only JPG, PNG, and PDF allowed.', 400);
    }
    if (file.size > MAX_SIZE) {
      throw new AppError('File too large. Maximum 10 MB.', 400);
    }

    const ext = path.extname(file.originalname);
    const filePath = `verification/${userId}/${documentType}_${uuidv4()}${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(config.storageBucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Verification doc upload failed', { userId, error: uploadError.message });
      throw new AppError('Failed to upload document', 500);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(config.storageBucket)
      .getPublicUrl(filePath);

    const { data: doc, error: insertError } = await supabaseAdmin
      .from('verification_documents')
      .insert({
        user_id: userId,
        document_type: documentType,
        file_url: urlData.publicUrl,
        file_path: filePath,
      })
      .select()
      .maybeSingle();

    if (insertError) throw new AppError('Failed to save document record', 500);

    await this.syncUserVerificationStatus(userId, 'pending');
    await this.syncVerificationRequests(userId, 'pending');

    // Notify all admins
    const { data: uploadUser } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', userId)
      .maybeSingle();
    const uploaderName = uploadUser?.name || 'A user';

    await this.notifyAdmins('verification_request', 'New Verification Request',
      `${uploaderName} has uploaded an ID document for verification.`);

    await activityLogService.log({
      user_id: userId,
      action: 'upload_verification_doc',
      resource_type: 'verification_documents',
      resource_id: doc.id,
      details: { document_type: documentType },
    });

    return doc as VerificationDocument;
  }

  /**
   * Get all verification documents for a user.
   */
  async getUserDocuments(userId: string): Promise<VerificationDocument[]> {
    const { data, error } = await supabaseAdmin
      .from('verification_documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      if (this.isMissingRelationError(error)) {
        logger.warn('verification_documents table missing; returning empty document list', { userId, code: error.code });
        return [];
      }

      throw new AppError('Failed to fetch documents', 500);
    }

    return (data || []) as VerificationDocument[];
  }

  /**
   * Get all pending verification requests (admin).
   */
  async getPendingRequests(): Promise<any[]> {
    // Get users with pending verification status who have uploaded docs
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, verification_status, created_at')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch verification requests', 500);

    const users = data || [];
    const documentsByUserId = await this.getDocumentsByUserIds(users.map(user => user.id));
    const results = users
      .map(user => ({ ...user, documents: documentsByUserId.get(user.id) || [] }))
      .filter(user => user.documents.length > 0);

    return results;
  }

  /**
   * Get all verification requests with optional status filter (admin).
   */
  async getAllRequests(status?: VerificationStatus): Promise<any[]> {
    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, role, verification_status, created_at')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('verification_status', status);
    }

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch users', 500);

    const users = data || [];
    const documentsByUserId = await this.getDocumentsByUserIds(users.map(user => user.id));
    const results = users.map(user => ({
      ...user,
      documents: documentsByUserId.get(user.id) || [],
    }));

    return results;
  }

  /**
   * Admin: approve user verification.
   * For advisor users: enables dashboard access.
   */
  async approveUser(
    userId: string,
    adminId: string,
    notes?: string
  ): Promise<void> {
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('users')
      .select('role, email, verification_status')
      .eq('id', userId)
      .maybeSingle();

    if (targetUserError) {
      throw new AppError('Failed to fetch user verification record', 500);
    }

    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    const isGov = targetUser.role === 'advisor';

    const previousStatus = targetUser.verification_status as VerificationStatus;
    const reviewedAt = new Date().toISOString();

    await this.syncUserVerificationStatus(userId, 'verified');

    try {
      await this.syncVerificationDocuments(userId, 'approved', adminId, notes, reviewedAt);
      await this.syncVerificationRequests(userId, 'approved', adminId, notes, reviewedAt);
    } catch (error) {
      await this.syncUserVerificationStatus(userId, previousStatus);
      throw error;
    }

    // Get admin name for personalized notification
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', adminId)
      .maybeSingle();
    const adminName = admin?.name || 'Admin';

    // Notify the user — they'll see this on next login (no SMTP)
    await notificationService.create({
      user_id: userId,
      type: 'verification_approved',
      title: isGov ? 'Application Approved ✅' : 'Account Verified ✅',
      body: isGov
        ? `${adminName} approved your advisor application. You now have full access to the platform.`
        : `${adminName} has verified your account. You now have full access to the dashboard.`,
    });

    await activityLogService.log({
      user_id: adminId,
      action: 'approve_verification',
      resource_type: 'user',
      resource_id: userId,
      details: { notes },
    });

    logger.info('User verified', { userId, adminId });
  }

  /**
   * Admin: reject user verification.
   */
  async rejectUser(
    userId: string,
    adminId: string,
    notes?: string
  ): Promise<void> {
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('users')
      .select('verification_status')
      .eq('id', userId)
      .maybeSingle();

    if (targetUserError) {
      throw new AppError('Failed to fetch user verification record', 500);
    }

    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    const previousStatus = targetUser.verification_status as VerificationStatus;
    const reviewedAt = new Date().toISOString();

    await this.syncUserVerificationStatus(userId, 'rejected');

    try {
      await this.syncVerificationDocuments(userId, 'rejected', adminId, notes, reviewedAt);
      await this.syncVerificationRequests(userId, 'rejected', adminId, notes, reviewedAt);
    } catch (error) {
      await this.syncUserVerificationStatus(userId, previousStatus);
      throw error;
    }

    // Notify the user
    const { data: rejectAdmin } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', adminId)
      .maybeSingle();
    const rejectAdminName = rejectAdmin?.name || 'Admin';

    await notificationService.create({
      user_id: userId,
      type: 'verification_rejected',
      title: 'Verification Rejected',
      body: notes
        ? `${rejectAdminName} rejected your verification: ${notes}`
        : `${rejectAdminName} rejected your verification. Please re-upload valid documents.`,
    });

    await activityLogService.log({
      user_id: adminId,
      action: 'reject_verification',
      resource_type: 'user',
      resource_id: userId,
      details: { notes },
    });

    logger.info('User verification rejected', { userId, adminId });
  }

  /**
   * Get a user's verification status.
   */
  async getStatus(userId: string): Promise<{ status: VerificationStatus; documents: VerificationDocument[] }> {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('verification_status')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) throw new AppError('User not found', 404);

    const docs = await this.getUserDocuments(userId);

    return {
      status: user.verification_status as VerificationStatus,
      documents: docs,
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

export const verificationService = new VerificationService();
