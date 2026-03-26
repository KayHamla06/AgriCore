// ============================================
// AgriCore — Plan Service Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { planService } from '../services/planService';
import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';

describe('PlanService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAll', () => {
    it('returns all plans ordered by created_at desc', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: 'p1', type: 'Irrigation' }, { id: 'p2', type: 'Fertilizer' }],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const plans = await planService.getAll();
      expect(plans).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('returns plan by ID', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'p1', type: 'Irrigation', status: 'Active' },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const plan = await planService.getById('p1');
      expect(plan.type).toBe('Irrigation');
    });

    it('throws 404 when plan not found', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(planService.getById('none')).rejects.toThrow('Plan not found');
    });
  });

  describe('create', () => {
    it('inserts and returns a new plan', async () => {
      const fromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'p-new',
            farmer_id: 'f1',
            type: 'Seeds',
            status: 'Draft',
            approval_status: 'Pending',
          },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const plan = await planService.create({
        farmer_id: 'f1',
        created_by: 'u1',
        created_by_role: 'farmer',
        type: 'Seeds',
        objectives: 'Plant maize',
        budget: 5000,
        timeline: '3 months',
        status: 'Draft',
        approval_status: 'Pending',
      });

      expect(plan.type).toBe('Seeds');
    });
  });

  describe('approve', () => {
    it('updates plan to Approved + Active', async () => {
      const fromChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'p1', approval_status: 'Approved', status: 'Active' },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const plan = await planService.approve('p1');
      expect(plan.approval_status).toBe('Approved');
      expect(plan.status).toBe('Active');
    });
  });

  describe('reject', () => {
    it('updates plan to Rejected', async () => {
      const fromChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'p1', approval_status: 'Rejected' },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const plan = await planService.reject('p1');
      expect(plan.approval_status).toBe('Rejected');
    });
  });

  describe('delete', () => {
    it('deletes a draft plan owned by the requester', async () => {
      // getById mock
      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'p1', created_by: 'u1', farmer_id: 'f1', status: 'Draft' },
              error: null,
            }),
          } as any;
        }
        return {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        } as any;
      });

      await expect(planService.delete('p1', 'u1')).resolves.not.toThrow();
    });

    it('rejects deletion of non-draft plans', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'p1', created_by: 'u1', farmer_id: 'f1', status: 'Active' },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(planService.delete('p1', 'u1')).rejects.toThrow('Only draft plans can be deleted');
    });

    it('rejects deletion by non-owner', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'p1', created_by: 'u2', farmer_id: 'f2', status: 'Draft' },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(planService.delete('p1', 'u-hacker')).rejects.toThrow(
        'You can only delete your own plans'
      );
    });
  });
});
