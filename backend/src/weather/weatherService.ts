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
   * Fetch historical daily weather from Open-Meteo archive API for a date period.
   */
  async fetchHistoricalRange(
    lat: number,
    lng: number,
    startDate: string,
    endDate: string
  ): Promise<Array<{ date: string; temperature_min: number | null; temperature_max: number | null; rainfall: number; wind_speed: number | null }>> {
    const baseUrl = config.weather.archiveApiUrl || 'https://archive-api.open-meteo.com/v1/archive';
    const url = `${baseUrl}?latitude=${lat}&longitude=${lng}`
      + `&start_date=${startDate}&end_date=${endDate}`
      + '&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,wind_speed_10m_max'
      + '&timezone=auto';

    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      throw new AppError('Failed to fetch historical weather', 502);
    }

    const json = await response.json() as {
      daily?: {
        time?: string[];
        temperature_2m_min?: Array<number | null>;
        temperature_2m_max?: Array<number | null>;
        precipitation_sum?: Array<number | null>;
        wind_speed_10m_max?: Array<number | null>;
      };
    };

    const days = json.daily?.time || [];
    const mins = json.daily?.temperature_2m_min || [];
    const maxes = json.daily?.temperature_2m_max || [];
    const rain = json.daily?.precipitation_sum || [];
    const wind = json.daily?.wind_speed_10m_max || [];

    return days.map((date, index) => ({
      date,
      temperature_min: mins[index] ?? null,
      temperature_max: maxes[index] ?? null,
      rainfall: rain[index] ?? 0,
      wind_speed: wind[index] ?? null,
    }));
  }

  /**
   * Persist historical weather rows and link them to the farm record.
   */
  async storeHistoricalSnapshot(
    farmerId: string,
    farmRecordId: string,
    rows: Array<{ date: string; temperature_min: number | null; temperature_max: number | null; rainfall: number; wind_speed: number | null }>
  ): Promise<void> {
    if (rows.length === 0) return;

    const payload = rows.map(row => ({
      farmer_id: farmerId,
      farm_record_id: farmRecordId,
      date: row.date,
      temperature_min: row.temperature_min,
      temperature_max: row.temperature_max,
      rainfall: row.rainfall,
      wind_speed: row.wind_speed,
      description: 'archive_snapshot',
    }));

    const { error } = await supabaseAdmin
      .from('weather_history')
      .upsert(payload, { onConflict: 'farmer_id,date' });

    if (error) {
      logger.warn('Weather: failed to store historical snapshot', { farmerId, farmRecordId, error: error.message });
    }
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
      .maybeSingle();

    if (error) return null;
    return data as WeatherRecord;
  }
}

export const weatherService = new WeatherService();
