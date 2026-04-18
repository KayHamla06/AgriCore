// ============================================
// AgriCore — Notice Cleanup Cron
// Deletes expired notices every hour.
// ============================================

import cron from 'node-cron';
import { noticeService } from '../services/noticeService';
import logger from '../utils/logger';

export function startNoticeCron(): void {
  // Every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      const removed = await noticeService.cleanupExpired();
      if (removed > 0) {
        logger.info(`Notice cron: removed ${removed} expired notice(s)`);
      }
    } catch (err) {
      logger.error('Notice cron: cleanup failed', { error: err });
    }
  });

  logger.info('Notice cron: scheduled (hourly expired-notice cleanup)');
}
