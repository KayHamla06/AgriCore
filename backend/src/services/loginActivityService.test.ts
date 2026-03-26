// ============================================
// AgriCore — Login Activity Service Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginActivityService } from '../services/loginActivityService';
import { supabaseAdmin } from '../config/supabaseClient';

vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LoginActivityService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('recordLogin', () => {
    it('inserts login record with IP and user agent', async () => {
      const fromChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      // Mock fetch for IP geolocation (localhost — skipped)
      await loginActivityService.recordLogin({
        user_id: 'user-1',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 Chrome',
      });

      expect(supabaseAdmin.from).toHaveBeenCalledWith('login_activity');
      expect(fromChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 Chrome',
        })
      );
    });

    it('does not throw on insert failure', async () => {
      const fromChain = {
        insert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(
        loginActivityService.recordLogin({ user_id: 'user-1' })
      ).resolves.not.toThrow();
    });

    it('handles missing IP gracefully', async () => {
      const fromChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await loginActivityService.recordLogin({ user_id: 'user-1' });

      expect(fromChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          ip_address: null,
          user_agent: null,
        })
      );
    });
  });

  describe('getByUser', () => {
    it('returns login activity for a user', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 'la1', user_id: 'user-1', ip_address: '1.2.3.4', login_at: '2024-01-01' },
            { id: 'la2', user_id: 'user-1', ip_address: '5.6.7.8', login_at: '2024-01-02' },
          ],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const result = await loginActivityService.getByUser('user-1');
      expect(result).toHaveLength(2);
      expect(fromChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('throws AppError on query failure', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(loginActivityService.getByUser('user-1')).rejects.toThrow(
        'Failed to fetch login activity'
      );
    });
  });

  describe('getRecent', () => {
    it('returns recent logins across all users', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 'la1' }, { id: 'la2' }],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const result = await loginActivityService.getRecent(10);
      expect(result).toHaveLength(2);
    });
  });
});
