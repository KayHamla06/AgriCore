// ============================================
// AgriCore — Cache Service Tests
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import { cacheService } from '../services/cacheService';

describe('CacheService', () => {
  beforeEach(() => {
    cacheService.invalidateAll();
  });

  describe('generic get/set', () => {
    it('stores and retrieves a value', () => {
      cacheService.set('test:key', { hello: 'world' });
      const result = cacheService.get<{ hello: string }>('test:key');
      expect(result).toEqual({ hello: 'world' });
    });

    it('returns undefined for missing keys', () => {
      const result = cacheService.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('supports custom TTL', () => {
      cacheService.set('ttl:key', 'value', 9999);
      expect(cacheService.get('ttl:key')).toBe('value');
    });
  });

  describe('admin stats', () => {
    it('caches and retrieves admin stats', () => {
      const stats = { totalUsers: 10, totalFarmers: 5 };
      cacheService.setAdminStats(stats);
      expect(cacheService.getAdminStats()).toEqual(stats);
    });

    it('invalidates admin and ticket stats together', () => {
      cacheService.setAdminStats({ count: 1 });
      cacheService.setTicketStats({ open: 3 });
      cacheService.invalidateAdminStats();
      expect(cacheService.getAdminStats()).toBeUndefined();
      expect(cacheService.getTicketStats()).toBeUndefined();
    });
  });

  describe('ticket stats', () => {
    it('caches and retrieves ticket stats', () => {
      const stats = { open: 3, resolved: 7 };
      cacheService.setTicketStats(stats);
      expect(cacheService.getTicketStats()).toEqual(stats);
    });
  });

  describe('dashboard', () => {
    it('caches per-user dashboard data', () => {
      cacheService.setDashboard('user1', { summary: 'ok' });
      cacheService.setDashboard('user2', { summary: 'good' });
      expect(cacheService.getDashboard('user1')).toEqual({ summary: 'ok' });
      expect(cacheService.getDashboard('user2')).toEqual({ summary: 'good' });
    });

    it('invalidates user dashboard', () => {
      cacheService.setDashboard('user1', { x: 1 });
      cacheService.invalidateUser('user1');
      expect(cacheService.getDashboard('user1')).toBeUndefined();
    });
  });

  describe('weather', () => {
    it('caches weather data per farmer', () => {
      cacheService.setWeather('f1', { temp: 25 });
      expect(cacheService.getWeather('f1')).toEqual({ temp: 25 });
    });

    it('invalidates weather data', () => {
      cacheService.setWeather('f1', { temp: 25 });
      cacheService.invalidateWeather('f1');
      expect(cacheService.getWeather('f1')).toBeUndefined();
    });
  });

  describe('invalidateAll', () => {
    it('clears all cached data', () => {
      cacheService.set('a', 1);
      cacheService.set('b', 2);
      cacheService.setAdminStats({ x: 1 });
      cacheService.invalidateAll();
      expect(cacheService.get('a')).toBeUndefined();
      expect(cacheService.get('b')).toBeUndefined();
      expect(cacheService.getAdminStats()).toBeUndefined();
    });
  });

  describe('stats', () => {
    it('returns cache statistics', () => {
      const s = cacheService.stats();
      expect(s).toHaveProperty('hits');
      expect(s).toHaveProperty('misses');
      expect(s).toHaveProperty('keys');
    });
  });
});
