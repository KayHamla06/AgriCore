// ============================================
// AgriCore — Admin Service Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../services/adminService';
import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';

vi.mock('../services/userService', () => ({
  userService: {
    deleteAccount: vi.fn(),
  },
}));

vi.mock('../services/notificationService', () => ({
  notificationService: { create: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../services/activityLogService', () => ({
  activityLogService: { log: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../services/cacheService', () => ({
  cacheService: {
    getAdminStats: vi.fn().mockReturnValue(undefined),
    setAdminStats: vi.fn(),
    invalidateAdminStats: vi.fn(),
  },
}));

import { userService } from '../services/userService';

describe('AdminService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getDeletionRequests', () => {
    it('returns all deletion requests', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: 'dr1', status: 'pending', user_id: 'u1' },
            { id: 'dr2', status: 'approved', user_id: 'u2' },
          ],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const requests = await adminService.getDeletionRequests();
      expect(requests).toHaveLength(2);
    });

    it('filters by status when provided', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'dr1', status: 'pending' }],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const requests = await adminService.getDeletionRequests('pending');
      expect(requests).toHaveLength(1);
    });
  });

  describe('rejectDeletion', () => {
    it('rejects a pending deletion request', async () => {
      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // getDeletionRequest
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'dr1', user_id: 'u1', status: 'pending' },
              error: null,
            }),
          } as any;
        }
        // update
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'dr1', status: 'rejected', reviewed_by: 'admin1' },
            error: null,
          }),
        } as any;
      });

      const result = await adminService.rejectDeletion('dr1', 'admin1', 'Not approved');
      expect(result.status).toBe('rejected');
    });

    it('throws if request is not pending', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'dr1', status: 'approved' },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(
        adminService.rejectDeletion('dr1', 'admin1')
      ).rejects.toThrow('This request has already been processed');
    });
  });

  describe('approveDeletion', () => {
    it('approves request and triggers account deletion', async () => {
      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // getDeletionRequest
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'dr1', user_id: 'u1', status: 'pending' },
              error: null,
            }),
          } as any;
        }
        if (callCount === 2) {
          // get user auth_id
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { auth_id: 'auth-del' },
              error: null,
            }),
          } as any;
        }
        // update deletion request
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'dr1', status: 'approved' },
            error: null,
          }),
        } as any;
      });

      vi.mocked(userService.deleteAccount).mockResolvedValue(undefined);

      const result = await adminService.approveDeletion('dr1', 'admin1', 'Approved');
      expect(result.status).toBe('approved');
      expect(userService.deleteAccount).toHaveBeenCalledWith('u1', 'auth-del');
    });
  });

  describe('getUsers', () => {
    it('returns all users', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: 'u1', name: 'User 1', role: 'farmer' },
            { id: 'u2', name: 'User 2', role: 'government' },
          ],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const users = await adminService.getUsers();
      expect(users).toHaveLength(2);
    });

    it('filters by role', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'u1', role: 'farmer' }],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const users = await adminService.getUsers('farmer');
      expect(users).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('returns system statistics', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        const needsEq = table === 'deletion_requests' || table === 'tickets';
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ count: 2 }),
        };
        if (!needsEq) {
          chain.select = vi.fn().mockResolvedValue({ count: table === 'users' ? 10 : table === 'farmers' ? 7 : 5 });
        } else {
          chain.select = vi.fn().mockReturnThis();
        }
        return chain;
      });

      const stats = await adminService.getStats();
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('totalFarmers');
      expect(stats).toHaveProperty('totalPlans');
      expect(stats).toHaveProperty('pendingDeletions');
      expect(stats).toHaveProperty('openTickets');
    });
  });
});
