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

    // Notify all admins
    await this.notifyAdmins('verification_request', 'New Verification Request',
      `A user has uploaded verification documents for review.`);

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

    // For each user, get their documents
    const results = [];
    for (const user of (data || [])) {
      const { data: docs, error: docsError } = await supabaseAdmin
        .from('verification_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (docsError && !this.isMissingRelationError(docsError)) {
        throw new AppError('Failed to fetch verification documents', 500);
      }

      if (docs && docs.length > 0) {
        results.push({ ...user, documents: docs });
      }
    }

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

    const results = [];
    for (const user of (data || [])) {
      const { data: docs, error: docsError } = await supabaseAdmin
        .from('verification_documents')
        .select('*')
        .eq('user_id', user.id);

      if (docsError && !this.isMissingRelationError(docsError)) {
        throw new AppError('Failed to fetch verification documents', 500);
      }

      results.push({ ...user, documents: docs || [] });
    }

    return results;
  }

  /**
   * Admin: approve user verification.
   * For government users: enables dashboard access.
   */
  async approveUser(
    userId: string,
    adminId: string,
    notes?: string
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        verification_status: 'verified',
      })
      .eq('id', userId);

    if (error) throw new AppError('Failed to approve verification', 500);

    // Update all pending docs to approved
    await supabaseAdmin
      .from('verification_documents')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
      })
      .eq('user_id', userId)
      .eq('status', 'pending');

    // Notify the user — they'll see this on next login (no SMTP)
    await notificationService.create({
      user_id: userId,
      type: 'verification_approved',
      title: 'Account Verified ✅',
      body: 'Your account has been verified. You now have full access to the dashboard.',
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
    const { error } = await supabaseAdmin
      .from('users')
      .update({ verification_status: 'rejected' })
      .eq('id', userId);

    if (error) throw new AppError('Failed to reject verification', 500);

    // Update all pending docs to rejected
    await supabaseAdmin
      .from('verification_documents')
      .update({
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
      })
      .eq('user_id', userId)
      .eq('status', 'pending');

    // Notify the user
    await notificationService.create({
      user_id: userId,
      type: 'verification_rejected',
      title: 'Verification Rejected',
      body: notes
        ? `Your verification was rejected: ${notes}`
        : 'Your verification was rejected. Please re-upload valid documents.',
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
