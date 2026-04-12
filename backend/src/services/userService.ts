// ============================================
// AgriCore — User Service
// Account management: profile, settings, delete,
// profile image, address, PDF export
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import path from 'path';
import type { UserNotificationSettings } from '../models/types';

export class UserService {
  /**
   * Get the full user + farmer profile by user ID.
   */
  async getProfile(userId: string) {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user) throw new AppError('User not found', 404);

    // If farmer, also fetch farmer profile
    if (user.role === 'farmer') {
      const { data: farmer } = await supabaseAdmin
        .from('farmers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      return { ...user, farmer };
    }

    return user;
  }

  /**
   * Update user settings (name, email, etc).
   */
  async updateSettings(
    userId: string,
    updates: { name?: string; phone?: string }
  ) {
    // Only allow known fields to be updated
    const safeUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.phone !== undefined) safeUpdates.phone = updates.phone;

    if (Object.keys(safeUpdates).length === 0) {
      throw new AppError('No valid settings to update', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(safeUpdates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      logger.error('Failed to update settings', { userId, error: error.message });
      throw new AppError('Failed to update settings', 500);
    }
    return data;
  }

  async updateProfile(userId: string, updates: { name?: string; phone?: string }) {
    return this.updateSettings(userId, updates);
  }

  async updateLocation(
    userId: string,
    location: { latitude: number; longitude: number }
  ) {
    if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
      throw new AppError('latitude and longitude must be valid numbers', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        latitude: location.latitude,
        longitude: location.longitude,
      })
      .eq('id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      if (error.code === '42703' || error.message?.includes('column')) {
        throw new AppError('Location fields not available. Run migration-support-settings-v2.sql.', 503);
      }
      throw new AppError('Failed to update location', 500);
    }

    await supabaseAdmin
      .from('farmers')
      .update({ latitude: location.latitude, longitude: location.longitude, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    return data;
  }

  async updateNotificationSettings(userId: string, settings: UserNotificationSettings) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ notification_settings: settings || {} })
      .eq('id', userId)
      .select('id, notification_settings')
      .maybeSingle();

    if (error) {
      if (error.code === '42703' || error.message?.includes('column')) {
        throw new AppError('Notification settings field not available. Run migration-support-settings-v2.sql.', 503);
      }
      throw new AppError('Failed to update notification settings', 500);
    }

    return data;
  }

  /**
   * Change password via Supabase Auth.
   */
  async changePassword(authId: string, newPassword: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(authId, {
      password: newPassword,
    });

    if (error) throw new AppError('Failed to change password', 500);
  }

  /**
   * DELETE ACCOUNT — cascading cleanup.
   * Removes: user record, farmer data, files, auth account.
   */
  async deleteAccount(userId: string, authId: string): Promise<void> {
    logger.info('Account deletion started', { userId });

    try {
      // 1. Get farmer profile for file cleanup
      const { data: farmer } = await supabaseAdmin
        .from('farmers')
        .select('id, profile_image_url, id_document_url, farm_images')
        .eq('user_id', userId)
        .maybeSingle();

      if (farmer) {
        // 2. Delete stored files
        const filesToDelete: string[] = [];
        if (farmer.profile_image_url) filesToDelete.push(farmer.profile_image_url);
        if (farmer.id_document_url) filesToDelete.push(farmer.id_document_url);
        if (farmer.farm_images && Array.isArray(farmer.farm_images)) {
          filesToDelete.push(...farmer.farm_images);
        }

        if (filesToDelete.length > 0) {
          await supabaseAdmin.storage
            .from('agricore-files')
            .remove(filesToDelete);
        }

        // 3. Delete farmer-related data (cascading via FK or manual)
        const farmerId = farmer.id;
        await supabaseAdmin.from('livestock').delete().eq('farmer_id', farmerId);
        await supabaseAdmin.from('crops').delete().eq('farmer_id', farmerId);
        await supabaseAdmin.from('soil_data').delete().eq('farmer_id', farmerId);
        await supabaseAdmin.from('weather_history').delete().eq('farmer_id', farmerId);
        await supabaseAdmin.from('support_plans').delete().eq('farmer_id', farmerId);

        // 4. Delete farmer profile
        await supabaseAdmin.from('farmers').delete().eq('id', farmerId);
      }

      // 5. Delete user row
      await supabaseAdmin.from('users').delete().eq('id', userId);

      // 6. Delete Supabase Auth user
      await supabaseAdmin.auth.admin.deleteUser(authId);

      logger.info('Account deletion completed', { userId });
    } catch (err) {
      logger.error('Account deletion failed', { userId, error: err });
      throw new AppError('Failed to delete account. Contact support.', 500);
    }
  }

  /**
   * Upload a profile image for any user (not just farmers).
   * Stores in Supabase Storage, saves URL to users.profile_image_url.
   */
  async uploadProfileImage(
    userId: string,
    file: Express.Multer.File
  ): Promise<string> {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new AppError(
        `Invalid file type: ${file.mimetype}. Only JPG and PNG are allowed.`,
        400
      );
    }

    if (file.size > MAX_SIZE) {
      throw new AppError(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 5MB`,
        400
      );
    }

    const ext = path.extname(file.originalname);
    const filePath = `profile-images/${userId}${ext}`;

    const { error } = await supabaseAdmin.storage
      .from(config.storageBucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      logger.error('Upload: user profile image failed', { userId, error: error.message });
      throw new AppError('Failed to upload profile image', 500);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(config.storageBucket)
      .getPublicUrl(filePath);

    await supabaseAdmin
      .from('users')
      .update({ profile_image_url: urlData.publicUrl })
      .eq('id', userId);

    return urlData.publicUrl;
  }

  /**
   * Update user address fields (structured 6-field address).
   */
  async updateAddress(
    userId: string,
    address: {
      address_number: string;
      street_name: string;
      suburb: string;
      town: string;
      province: string;
      postal_code: string;
    }
  ) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        address_number: address.address_number,
        street_name: address.street_name,
        suburb: address.suburb,
        town: address.town,
        province: address.province,
        postal_code: address.postal_code,
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      // If address columns don't exist yet (migration-profile-address.sql not run)
      if (error.code === '42703' || error.message?.includes('column')) {
        logger.warn('Address columns missing — run migration-profile-address.sql', { error: error.message });
        throw new AppError(
          'Address fields not available. Database migration required.',
          503
        );
      }
      throw new AppError('Failed to update address', 500);
    }
    return data;
  }
}

export const userService = new UserService();
