// ============================================
// AgriCore — Data Approval Service Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dataApprovalService } from '../services/dataApprovalService';
import { supabaseAdmin } from '../config/supabaseClient';

vi.mock('../services/notificationService', () => ({
  notificationService: {
    create: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../services/activityLogService', () => ({
  activityLogService: {
    log: vi.fn().mockResolvedValue(null),
  },
}));

describe('DataApprovalService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('submitChangeRequest', () => {
    it('creates a change request and notifies admins', async () => {
      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Insert into data_change_requests
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'cr1', user_id: 'u1', resource_type: 'livestock', action: 'create', status: 'pending' },
              error: null,
            }),
          } as any;
        }
        // Get admins
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'admin1' }],
            error: null,
          }),
        } as any;
      });

      const result = await dataApprovalService.submitChangeRequest('u1', 'livestock', 'res1', 'create', { total: 50 });
      expect(result.id).toBe('cr1');
      expect(result.status).toBe('pending');
    });

    it('throws on database error', async () => {
      const fromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'DB error' },
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(dataApprovalService.submitChangeRequest('u1', 'livestock', 'res1', 'create', {}))
        .rejects.toThrow('Failed to create change request');
    });
  });

  describe('getPending', () => {
    it('returns pending data change requests', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: 'cr1', resource_type: 'livestock', status: 'pending' },
            { id: 'cr2', resource_type: 'crops', status: 'pending' },
          ],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const results = await dataApprovalService.getPending();
      expect(results).toHaveLength(2);
    });
  });

  describe('approve', () => {
    it('approves a pending data change request', async () => {
      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch the request
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'cr1', user_id: 'u1', resource_type: 'livestock', resource_id: 'lr1', status: 'pending' },
              error: null,
            }),
          } as any;
        }
        if (callCount === 2) {
          // Update the data row
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        if (callCount === 3) {
          // Update the change request
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        // Notification/logging calls
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      });

      await expect(dataApprovalService.approve('cr1', 'admin1', 'Approved'))
        .resolves.not.toThrow();
    });

    it('throws if request not found', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(dataApprovalService.approve('nonexistent', 'admin1'))
        .rejects.toThrow('Change request not found');
    });

    it('throws if already reviewed', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'cr1', status: 'approved' },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(dataApprovalService.approve('cr1', 'admin1'))
        .rejects.toThrow('Request already reviewed');
    });
  });

  describe('reject', () => {
    it('rejects a pending data change request', async () => {
      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'cr1', user_id: 'u1', resource_type: 'crops', resource_id: 'cr1', status: 'pending' },
              error: null,
            }),
          } as any;
        }
        if (callCount === 2) {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        if (callCount === 3) {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      });

      await expect(dataApprovalService.reject('cr1', 'admin1', 'Invalid data'))
        .resolves.not.toThrow();
    });

    it('throws if request not found', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(dataApprovalService.reject('nonexistent', 'admin1'))
        .rejects.toThrow('Change request not found');
    });
  });

  describe('getStats', () => {
    it('returns counts for each status', async () => {
      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            count: callCount === 1 ? 5 : callCount === 2 ? 10 : 3,
            error: null,
          }),
        } as any;
      });

      const stats = await dataApprovalService.getStats();
      expect(stats.pendingData).toBe(5);
      expect(stats.approvedData).toBe(10);
      expect(stats.rejectedData).toBe(3);
    });
  });

  describe('getAll', () => {
    it('returns all requests with no filters', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: 'cr1' }, { id: 'cr2' }],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const results = await dataApprovalService.getAll();
      expect(results).toHaveLength(2);
    });

    it('filters by status', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'cr1', status: 'pending' }],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const results = await dataApprovalService.getAll({ status: 'pending' });
      expect(results).toHaveLength(1);
    });
  });
});
