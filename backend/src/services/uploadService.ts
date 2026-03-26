// ============================================
// AgriCore — Upload Service
// Handles file uploads to Supabase Storage
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export class UploadService {
  /**
   * Upload a farm image.
   * Returns the public URL of the uploaded file.
   */
  async uploadFarmImage(
    farmerId: string,
    file: Express.Multer.File
  ): Promise<string> {
    this.validateFile(file, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE);

    const ext = path.extname(file.originalname);
    const filePath = `farms/${farmerId}/${uuidv4()}${ext}`;

    const { error } = await supabaseAdmin.storage
      .from(config.storageBucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      logger.error('Upload: farm image failed', { farmerId, error: error.message });
      throw new AppError('Failed to upload farm image', 500);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(config.storageBucket)
      .getPublicUrl(filePath);

    // Store reference in farmer's farm_images array
    await supabaseAdmin.rpc('append_farm_image', {
      p_farmer_id: farmerId,
      p_image_url: urlData.publicUrl,
    });

    return urlData.publicUrl;
  }

  /**
   * Upload an ID document (PDF or image).
   */
  async uploadIdDocument(
    farmerId: string,
    file: Express.Multer.File
  ): Promise<string> {
    this.validateFile(file, ALLOWED_DOC_TYPES, MAX_FILE_SIZE);

    const ext = path.extname(file.originalname);
    // ID docs stored in a private bucket path
    const filePath = `id-docs/${farmerId}/${uuidv4()}${ext}`;

    const { error } = await supabaseAdmin.storage
      .from(config.storageBucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      logger.error('Upload: ID document failed', { farmerId, error: error.message });
      throw new AppError('Failed to upload ID document', 500);
    }

    // Generate a signed URL (private — expires in 1 hour)
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(config.storageBucket)
      .createSignedUrl(filePath, 3600);

    if (signedError) {
      throw new AppError('File uploaded but failed to generate URL', 500);
    }

    // Store reference in farmer profile
    await supabaseAdmin
      .from('farmers')
      .update({ id_document_url: filePath }) // store the path, not signed URL
      .eq('id', farmerId);

    return signedData.signedUrl;
  }

  /**
   * Upload a profile image.
   */
  async uploadProfileImage(
    farmerId: string,
    file: Express.Multer.File
  ): Promise<string> {
    this.validateFile(file, ALLOWED_IMAGE_TYPES, 5 * 1024 * 1024);

    const ext = path.extname(file.originalname);
    const filePath = `profiles/${farmerId}${ext}`;

    const { error } = await supabaseAdmin.storage
      .from(config.storageBucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true, // overwrite existing profile photo
      });

    if (error) {
      logger.error('Upload: profile image failed', { farmerId, error: error.message });
      throw new AppError('Failed to upload profile image', 500);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(config.storageBucket)
      .getPublicUrl(filePath);

    await supabaseAdmin
      .from('farmers')
      .update({ profile_image_url: urlData.publicUrl })
      .eq('id', farmerId);

    return urlData.publicUrl;
  }

  /**
   * Get a signed URL for a private file (e.g. ID documents).
   */
  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(config.storageBucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw new AppError('Failed to generate signed URL', 500);
    return data.signedUrl;
  }

  /**
   * Delete a file from storage.
   */
  async deleteFile(filePath: string): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from(config.storageBucket)
      .remove([filePath]);

    if (error) {
      logger.error('Upload: delete failed', { filePath, error: error.message });
      throw new AppError('Failed to delete file', 500);
    }
  }

  // ==========================================
  //  PRIVATE HELPERS
  // ==========================================

  private validateFile(
    file: Express.Multer.File,
    allowedTypes: string[],
    maxSize: number
  ): void {
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError(
        `Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`,
        400
      );
    }

    if (file.size > maxSize) {
      throw new AppError(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${(maxSize / 1024 / 1024).toFixed(0)}MB`,
        400
      );
    }
  }
}

export const uploadService = new UploadService();
