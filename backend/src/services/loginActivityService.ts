// ============================================
// AgriCore — Login Activity Service
// Tracks user login events with IP geolocation
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import type { LoginActivity } from '../models/types';

export class LoginActivityService {
  /**
   * Record a login event. Non-blocking — failures are logged, not thrown.
   */
  async recordLogin(data: {
    user_id: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    try {
      let geo: { city?: string; region?: string; country?: string; lat?: number; lon?: number } = {};

      // Resolve IP to geolocation using ip-api.com (free, no key needed)
      if (data.ip_address && data.ip_address !== '127.0.0.1' && data.ip_address !== '::1') {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);

          const resp = await fetch(
            `http://ip-api.com/json/${encodeURIComponent(data.ip_address)}?fields=status,city,regionName,country,lat,lon`,
            { signal: controller.signal }
          );
          clearTimeout(timeout);

          if (resp.ok) {
            const json = await resp.json() as {
              status: string;
              city?: string;
              regionName?: string;
              country?: string;
              lat?: number;
              lon?: number;
            };
            if (json.status === 'success') {
              geo = {
                city: json.city,
                region: json.regionName,
                country: json.country,
                lat: json.lat,
                lon: json.lon,
              };
            }
          }
        } catch {
          // Geolocation lookup failed — continue without it
          logger.warn('IP geolocation lookup failed', { ip: data.ip_address });
        }
      }

      const { error } = await supabaseAdmin
        .from('login_activity')
        .insert({
          user_id: data.user_id,
          ip_address: data.ip_address || null,
          user_agent: data.user_agent || null,
          city: geo.city || null,
          region: geo.region || null,
          country: geo.country || null,
          latitude: geo.lat || null,
          longitude: geo.lon || null,
        });

      if (error) {
        logger.error('Login activity insert failed', { error: error.message });
      }
    } catch (err) {
      logger.error('Login activity recording failed', { error: err });
    }
  }

  /**
   * Get login history for a specific user (admin use).
   */
  async getByUser(userId: string, limit = 50): Promise<LoginActivity[]> {
    const { data, error } = await supabaseAdmin
      .from('login_activity')
      .select('*')
      .eq('user_id', userId)
      .order('login_at', { ascending: false })
      .limit(limit);

    if (error) throw new AppError('Failed to fetch login activity', 500);
    return (data || []) as LoginActivity[];
  }

  /**
   * Get recent login activity across all users (admin overview).
   */
  async getRecent(limit = 100): Promise<LoginActivity[]> {
    const { data, error } = await supabaseAdmin
      .from('login_activity')
      .select('*, users:user_id(name, email, role)')
      .order('login_at', { ascending: false })
      .limit(limit);

    if (error) throw new AppError('Failed to fetch recent logins', 500);
    return (data || []) as LoginActivity[];
  }
}

export const loginActivityService = new LoginActivityService();
