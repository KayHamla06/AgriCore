// ============================================
// AgriCore — Smart Cache Service
// ============================================
// Caches NON-SENSITIVE data only:
//   ✅ Dashboard summaries, analytics, weather, stats
//   ❌ NEVER: ID docs, personal data, tokens, passwords

import NodeCache from 'node-cache';
import logger from '../utils/logger';

// Default TTL: 5 minutes, check for expired keys every 60s
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const KEYS = {
  adminStats: 'admin:stats',
  ticketStats: 'tickets:stats',
  dashboardSummary: (userId: string) => `dashboard:${userId}`,
  analytics: (userId: string) => `analytics:${userId}`,
  weather: (farmerId: string) => `weather:${farmerId}`,
} as const;

export const cacheService = {
  // ── Generic get/set ──────────────────────────
  get<T>(key: string): T | undefined {
    return cache.get<T>(key);
  },

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    if (ttlSeconds) {
      cache.set(key, value, ttlSeconds);
    } else {
      cache.set(key, value);
    }
  },

  // ── Admin Stats ──────────────────────────────
  getAdminStats<T>(): T | undefined {
    return cache.get<T>(KEYS.adminStats);
  },

  setAdminStats<T>(data: T): void {
    cache.set(KEYS.adminStats, data, 120); // 2 min TTL for stats
  },

  // ── Ticket Stats ─────────────────────────────
  getTicketStats<T>(): T | undefined {
    return cache.get<T>(KEYS.ticketStats);
  },

  setTicketStats<T>(data: T): void {
    cache.set(KEYS.ticketStats, data, 120);
  },

  // ── Dashboard Summary ────────────────────────
  getDashboard<T>(userId: string): T | undefined {
    return cache.get<T>(KEYS.dashboardSummary(userId));
  },

  setDashboard<T>(userId: string, data: T): void {
    cache.set(KEYS.dashboardSummary(userId), data);
  },

  // ── Weather ──────────────────────────────────
  getWeather<T>(farmerId: string): T | undefined {
    return cache.get<T>(KEYS.weather(farmerId));
  },

  setWeather<T>(farmerId: string, data: T, ttlSeconds = 600): void {
    cache.set(KEYS.weather(farmerId), data, ttlSeconds); // 10 min default
  },

  // ── Invalidation ─────────────────────────────
  invalidateAdminStats(): void {
    cache.del(KEYS.adminStats);
    cache.del(KEYS.ticketStats);
  },

  invalidateUser(userId: string): void {
    cache.del(KEYS.dashboardSummary(userId));
    cache.del(KEYS.analytics(userId));
  },

  invalidateWeather(farmerId: string): void {
    cache.del(KEYS.weather(farmerId));
  },

  invalidateAll(): void {
    cache.flushAll();
    logger.info('Cache flushed');
  },

  // ── Stats (for monitoring) ───────────────────
  stats() {
    return cache.getStats();
  },
};
