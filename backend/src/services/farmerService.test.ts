// ============================================
// AgriCore — Farmer Service Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { farmerService } from '../services/farmerService';
import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';

describe('FarmerService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAll', () => {
    it('returns paginated list of farmers', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: 'f1', name: 'Farmer 1' }],
          error: null,
          count: 1,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const result = await farmerService.getAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('calculates correct pagination range', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 25,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const result = await farmerService.getAll({ page: 3, limit: 10 });

      expect(fromChain.range).toHaveBeenCalledWith(20, 29);
      expect(result.totalPages).toBe(3);
    });

    it('throws on database error', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'DB error' },
          count: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(farmerService.getAll({ page: 1, limit: 10 })).rejects.toThrow(AppError);
    });
  });

  describe('getById', () => {
    it('returns farmer by ID', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'f1', name: 'Test Farmer' },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const farmer = await farmerService.getById('f1');
      expect(farmer.name).toBe('Test Farmer');
    });

    it('throws 404 when farmer not found', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(farmerService.getById('nonexistent')).rejects.toThrow('Farmer not found');
    });
  });

  describe('updateProfile', () => {
    it('updates and returns farmer profile', async () => {
      const fromChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'f1', name: 'Updated', farm_size_hectares: 50 },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const result = await farmerService.updateProfile('f1', { name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
    });
  });

  describe('getLivestock', () => {
    it('returns livestock records for a farmer', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: 'l1', animal_type: 'cattle', total: 50 }],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const records = await farmerService.getLivestock('f1');
      expect(records).toHaveLength(1);
      expect(records[0].animal_type).toBe('cattle');
    });
  });

  describe('addLivestock', () => {
    it('inserts a new livestock record', async () => {
      const fromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'l-new', farmer_id: 'f1', animal_type: 'goats', total: 20 },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const record = await farmerService.addLivestock('f1', {
        animal_type: 'goats',
        total: 20,
        born: 5,
        twins: 0,
        triplets: 0,
        sold: 2,
        consumed: 1,
        young: 5,
        last_dosed: null,
        diseases: [],
        treatment: '',
      });

      expect(record.animal_type).toBe('goats');
    });
  });

  describe('getCrops', () => {
    it('returns crop records for a farmer', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: 'c1', crop_name: 'maize' }],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const crops = await farmerService.getCrops('f1');
      expect(crops[0].crop_name).toBe('maize');
    });
  });

  describe('getSoilData', () => {
    it('returns soil data for a farmer', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: 's1', ph_level: 6.5, soil_type: 'loam' }],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const soil = await farmerService.getSoilData('f1');
      expect(soil[0].soil_type).toBe('loam');
    });
  });
});
