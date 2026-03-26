// ============================================
// AgriCore — Weather Routes
// Weather data endpoints (auto-fetched by cron)
// ============================================

import { Router } from 'express';
import { authMiddleware, requireRole, requireOwnerOrGov } from '../middleware';
import { weatherService } from '../weather/weatherService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authMiddleware);

// GET /api/weather/:farmerId — get weather history for a farmer
router.get('/:farmerId', requireOwnerOrGov, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 365);
    const records = await weatherService.getHistory(req.params.farmerId, limit);
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

// GET /api/weather/:farmerId/latest — latest weather for a farmer
router.get('/:farmerId/latest', requireOwnerOrGov, async (req, res, next) => {
  try {
    const record = await weatherService.getLatest(req.params.farmerId);
    if (!record) throw new AppError('No weather data available', 404);
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

// POST /api/weather/fetch-all — manually trigger weather fetch (gov only)
router.post('/fetch-all', requireRole('government'), async (_req, res, next) => {
  try {
    await weatherService.fetchAllFarmersWeather();
    res.json({ success: true, message: 'Weather data fetched for all farmers' });
  } catch (err) {
    next(err);
  }
});

export default router;
