// ============================================
// AgriCore — Weather Cron Job
// Runs daily at midnight to fetch weather
// for all farms with coordinates
// ============================================

import cron from 'node-cron';
import { weatherService } from './weatherService';
import logger from '../utils/logger';

/**
 * Start the weather cron job.
 * Runs at 00:00 every day (SAST).
 */
export function startWeatherCron(): void {
  // "0 0 * * *" = every day at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Weather cron: triggered');

    try {
      await weatherService.fetchAllFarmersWeather();
    } catch (err) {
      logger.error('Weather cron: unhandled error', { error: err });
    }
  });

  logger.info('Weather cron: scheduled (daily at 00:00)');
}
