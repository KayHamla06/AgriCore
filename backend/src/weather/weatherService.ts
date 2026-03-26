// ============================================
// AgriCore — Weather Service
// Fetches weather data from external API,
// stores in DB, provides history endpoints
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { config } from '../config';
import { parseWeatherResponse, parseOpenMeteoResponse, type ParsedWeather } from './weatherParser';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import type { WeatherRecord } from '../models/types';

export class WeatherService {
  /**
   * Fetch weather for a single farm location.
   */
  /**
   * Check if we're using the Open-Meteo provider.
   */
  private isOpenMeteo(): boolean {
    return config.weather.apiUrl.includes('open-meteo.com');
  }

  async fetchWeather(lat: number, lng: number): Promise<ParsedWeather | null> {
    if (!config.weather.apiUrl) {
      logger.warn('Weather: API not configured');
      return null;
    }

    let url: string;

    if (this.isOpenMeteo()) {
      // Open-Meteo — free, no API key needed
      url = `${config.weather.apiUrl}?latitude=${lat}&longitude=${lng}`
        + `&current=temperature_2m,wind_speed_10m`
        + `&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation`
        + `&timezone=auto&forecast_days=1`;
    } else {
      // Legacy provider (SA Weather Service) — requires API key
      if (!config.weather.apiKey) {
        logger.warn('Weather: API key not configured for legacy provider');
        return null;
      }
      const legacyUrl = new URL(config.weather.apiUrl);
      legacyUrl.searchParams.set('lat', String(lat));
      legacyUrl.searchParams.set('lng', String(lng));
      legacyUrl.searchParams.set('key', config.weather.apiKey);
      url = legacyUrl.toString();
    }

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      logger.error('Weather: API request failed', {
        status: response.status,
        lat,
        lng,
      });
      return null;
    }

    const data = await response.json();

    return this.isOpenMeteo()
      ? parseOpenMeteoResponse(data as Record<string, unknown>)
      : parseWeatherResponse(data as Record<string, unknown>);
  }

  /**
   * Store a weather record for a farmer.
   */
  async storeWeatherRecord(
    farmerId: string,
    weather: ParsedWeather
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // Upsert — one record per farmer per day
    const { error } = await supabaseAdmin
      .from('weather_history')
      .upsert(
        {
          farmer_id: farmerId,
          date: today,
          ...weather,
        },
        { onConflict: 'farmer_id,date' }
      );

    if (error) {
      logger.error('Weather: failed to store record', {
        farmerId,
        error: error.message,
      });
    }
  }

  /**
   * Fetch and store weather for ALL farmers with coordinates.
   * Called by the daily cron job.
   */
  async fetchAllFarmersWeather(): Promise<void> {
    logger.info('Weather cron: starting daily fetch');

    const { data: farmers, error } = await supabaseAdmin
      .from('farmers')
      .select('id, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error || !farmers) {
      logger.error('Weather cron: failed to fetch farmers', {
        error: error?.message,
      });
      return;
    }

    let success = 0;
    let failed = 0;

    for (const farmer of farmers) {
      try {
        const weather = await this.fetchWeather(farmer.latitude, farmer.longitude);
        if (weather) {
          await this.storeWeatherRecord(farmer.id, weather);
          success++;
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
        logger.error('Weather cron: error for farmer', {
          farmerId: farmer.id,
          error: err,
        });
      }

      // Rate limiting — don't hammer the API
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    logger.info('Weather cron: completed', {
      total: farmers.length,
      success,
      failed,
    });
  }

  /**
   * Get weather history for a farmer.
   */
  async getHistory(farmerId: string, limit = 30): Promise<WeatherRecord[]> {
    const { data, error } = await supabaseAdmin
      .from('weather_history')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw new AppError('Failed to fetch weather history', 500);
    return data as WeatherRecord[];
  }

  /**
   * Get latest weather record for a farmer.
   */
  async getLatest(farmerId: string): Promise<WeatherRecord | null> {
    const { data, error } = await supabaseAdmin
      .from('weather_history')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data as WeatherRecord;
  }
}

export const weatherService = new WeatherService();
