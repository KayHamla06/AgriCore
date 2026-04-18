// ============================================
// AgriCore — Farmer Service
// CRUD for farmer profiles, livestock, crops, soil
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import { dataApprovalService } from './dataApprovalService';
import { weatherService } from '../weather/weatherService';
import type {
  FarmerProfile,
  LivestockRecord,
  CropRecord,
  SoilData,
  FarmRecord,
  AnalyticsSummary,
  PaginationParams,
  PaginatedResponse,
} from '../models/types';

export class FarmerService {
  private calculateAnalytics(payload: {
    cropYield: number;
    livestockCount: number;
    hasCropData?: boolean;
    hasLivestockData?: boolean;
  }): { performanceScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' } {
    const cropYield = Number.isFinite(payload.cropYield) ? payload.cropYield : 0;
    const livestockCount = Number.isFinite(payload.livestockCount) ? payload.livestockCount : 0;
    const hasCrop = payload.hasCropData !== undefined ? payload.hasCropData : true;
    const hasLivestock = payload.hasLivestockData !== undefined ? payload.hasLivestockData : true;

    if (hasCrop && hasLivestock && cropYield <= 0 && livestockCount <= 0) {
      return { performanceScore: 0, riskLevel: 'HIGH' };
    }

    if (hasCrop && !hasLivestock && cropYield <= 0) {
      return { performanceScore: 0, riskLevel: 'HIGH' };
    }

    if (hasLivestock && !hasCrop && livestockCount <= 0) {
      return { performanceScore: 0, riskLevel: 'HIGH' };
    }

    const cropScore = hasCrop ? Math.max(0, Math.min(100, Math.round(cropYield * 10))) : 0;
    const livestockScore = hasLivestock ? Math.max(0, Math.min(100, livestockCount > 0 ? Math.round(20 + (livestockCount * 2)) : 0)) : 0;
    const denominator = (hasCrop ? 1 : 0) + (hasLivestock ? 1 : 0) || 1;
    const performanceScore = Math.round((cropScore + livestockScore) / denominator);

    if (performanceScore < 40) return { performanceScore, riskLevel: 'HIGH' };
    if (performanceScore < 70) return { performanceScore, riskLevel: 'MEDIUM' };
    return { performanceScore, riskLevel: 'LOW' };
  }

  private async getUserProvince(userId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('province')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // province column may not exist yet if migration not applied
      return null;
    }

    return (data?.province as string | null) || null;
  }

  async createFarmRecord(
    userId: string,
    payload: {
      start_date: string;
      end_date: string;
      crop_yield?: number;
      livestock_count?: number;
      has_crop_data?: boolean;
      has_livestock_data?: boolean;
    }
  ): Promise<{ record: FarmRecord; analytics: AnalyticsSummary; weatherDaysStored: number }> {
    if (!payload.start_date || !payload.end_date) {
      throw new AppError('start_date and end_date are required', 400);
    }

    if (payload.end_date < payload.start_date) {
      throw new AppError('end_date must be on or after start_date', 400);
    }

    const farmer = await this.getByUserId(userId);
    const province = await this.getUserProvince(userId);

    const cropYield = Number(payload.crop_yield || 0);
    const livestockCount = Number(payload.livestock_count || 0);

    const { data: record, error: recordError } = await supabaseAdmin
      .from('farm_records')
      .insert({
        farmer_id: farmer.id,
        user_id: userId,
        province,
        start_date: payload.start_date,
        end_date: payload.end_date,
        crop_yield: cropYield,
        livestock_count: livestockCount,
      })
      .select('*')
      .maybeSingle();

    if (recordError || !record) {
      throw new AppError('Failed to create farm record. Ensure migration-farm-records-v2.sql is applied.', 500);
    }

    const calculated = this.calculateAnalytics({
      cropYield,
      livestockCount,
      hasCropData: payload.has_crop_data,
      hasLivestockData: payload.has_livestock_data,
    });

    const { data: analytics, error: analyticsError } = await supabaseAdmin
      .from('analytics')
      .upsert({
        user_id: userId,
        province,
        performance_score: calculated.performanceScore,
        risk_level: calculated.riskLevel,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select('*')
      .maybeSingle();

    if (analyticsError || !analytics) {
      throw new AppError('Failed to update analytics. Ensure migration-farm-records-v2.sql is applied.', 500);
    }

    let weatherDaysStored = 0;
    if (farmer.latitude !== null && farmer.longitude !== null) {
      try {
        const rows = await weatherService.fetchHistoricalRange(
          Number(farmer.latitude),
          Number(farmer.longitude),
          payload.start_date,
          payload.end_date
        );

        weatherDaysStored = rows.length;
        await weatherService.storeHistoricalSnapshot(farmer.id, record.id, rows);
      } catch {
        weatherDaysStored = 0;
      }
    }

    return {
      record: record as FarmRecord,
      analytics: analytics as AnalyticsSummary,
      weatherDaysStored,
    };
  }

  async getFarmHistory(userId: string, startDate?: string, endDate?: string): Promise<FarmRecord[]> {
    let query = supabaseAdmin
      .from('farm_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (startDate && endDate) {
      query = query.gte('created_at', `${startDate}T00:00:00.000Z`).lte('created_at', `${endDate}T23:59:59.999Z`);
    } else {
      const since = new Date();
      since.setMonth(since.getMonth() - 12);
      query = query.gte('created_at', since.toISOString());
    }

    const { data, error } = await query;
    if (error) {
      throw new AppError('Failed to fetch farm history. Ensure migration-farm-records-v2.sql is applied.', 500);
    }

    return (data || []) as FarmRecord[];
  }

  async getLatestAnalytics(userId: string): Promise<AnalyticsSummary> {
    const { data, error } = await supabaseAdmin
      .from('analytics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return {
        id: 'generated-default',
        user_id: userId,
        province: await this.getUserProvince(userId),
        performance_score: 0,
        risk_level: 'HIGH',
        updated_at: new Date().toISOString(),
      };
    }

    return data as AnalyticsSummary;
  }

  // ==========================================
  //  FARMER PROFILES
  // ==========================================

  async getAll(params: PaginationParams): Promise<PaginatedResponse<FarmerProfile>> {
    const { page, limit } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from('farmers')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch farmers', 500);

    return {
      data: data as FarmerProfile[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async getById(farmerId: string): Promise<FarmerProfile> {
    const { data, error } = await supabaseAdmin
      .from('farmers')
      .select('*')
      .eq('id', farmerId)
      .maybeSingle();

    if (error || !data) throw new AppError('Farmer not found', 404);
    return data as FarmerProfile;
  }

  async getByUserId(userId: string): Promise<FarmerProfile> {
    const { data, error } = await supabaseAdmin
      .from('farmers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      return data as FarmerProfile;
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user || user.role !== 'farmer') {
      throw new AppError('Farmer profile not found', 404);
    }

    const { data: created, error: createError } = await supabaseAdmin
      .from('farmers')
      .insert({
        user_id: user.id,
        name: user.name,
        email: user.email,
        province: 'Unknown',
        district: 'Unknown',
        farm_size_hectares: 0,
      })
      .select('*')
      .maybeSingle();

    if (createError || !created) throw new AppError('Failed to create farmer profile', 500);

    return created as FarmerProfile;
  }

  async updateProfile(
    farmerId: string,
    updates: Partial<FarmerProfile>
  ): Promise<FarmerProfile> {
    // Strip fields that shouldn't be updated directly
    const { id: _id, user_id: _uid, created_at: _ca, ...safeUpdates } = updates as Record<string, unknown>;

    const { data, error } = await supabaseAdmin
      .from('farmers')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', farmerId)
      .select()
      .maybeSingle();

    if (error) throw new AppError('Failed to update farmer profile', 500);
    return data as FarmerProfile;
  }

  async getByDistrict(district: string): Promise<FarmerProfile[]> {
    const { data, error } = await supabaseAdmin
      .from('farmers')
      .select('*')
      .eq('district', district);

    if (error) throw new AppError('Failed to fetch farmers by district', 500);
    return data as FarmerProfile[];
  }

  async getByProvince(province: string): Promise<FarmerProfile[]> {
    const { data, error } = await supabaseAdmin
      .from('farmers')
      .select('*')
      .eq('province', province);

    if (error) throw new AppError('Failed to fetch farmers by province', 500);
    return data as FarmerProfile[];
  }

  // ==========================================
  //  LIVESTOCK
  // ==========================================

  async getLivestock(farmerId: string): Promise<LivestockRecord[]> {
    const { data, error } = await supabaseAdmin
      .from('livestock')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('recorded_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch livestock records', 500);
    return data as LivestockRecord[];
  }

  async addLivestock(farmerId: string, record: Omit<LivestockRecord, 'id' | 'farmer_id' | 'recorded_at'>, userId?: string): Promise<LivestockRecord> {
    const { data, error } = await supabaseAdmin
      .from('livestock')
      .insert({ ...record, farmer_id: farmerId, data_status: 'pending' })
      .select()
      .maybeSingle();

    if (error) throw new AppError('Failed to add livestock record', 500);

    // Create data change request for admin approval
    if (userId) {
      await dataApprovalService.submitChangeRequest(userId, 'livestock', data.id, 'create', { ...record, farmer_id: farmerId });
    }

    return data as LivestockRecord;
  }

  // ==========================================
  //  CROPS
  // ==========================================

  async getCrops(farmerId: string): Promise<CropRecord[]> {
    const { data, error } = await supabaseAdmin
      .from('crops')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('recorded_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch crop records', 500);
    return data as CropRecord[];
  }

  async addCrop(farmerId: string, record: Omit<CropRecord, 'id' | 'farmer_id' | 'recorded_at'>, userId?: string): Promise<CropRecord> {
    const { data, error } = await supabaseAdmin
      .from('crops')
      .insert({ ...record, farmer_id: farmerId, data_status: 'pending' })
      .select()
      .maybeSingle();

    if (error) throw new AppError('Failed to add crop record', 500);

    if (userId) {
      await dataApprovalService.submitChangeRequest(userId, 'crops', data.id, 'create', { ...record, farmer_id: farmerId });
    }

    return data as CropRecord;
  }

  // ==========================================
  //  SOIL DATA
  // ==========================================

  async getSoilData(farmerId: string): Promise<SoilData[]> {
    const { data, error } = await supabaseAdmin
      .from('soil_data')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('recorded_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch soil data', 500);
    return data as SoilData[];
  }

  async addSoilData(farmerId: string, record: Omit<SoilData, 'id' | 'farmer_id' | 'recorded_at'>, userId?: string): Promise<SoilData> {
    const { data, error } = await supabaseAdmin
      .from('soil_data')
      .insert({ ...record, farmer_id: farmerId, data_status: 'pending' })
      .select()
      .maybeSingle();

    if (error) throw new AppError('Failed to add soil data', 500);

    if (userId) {
      await dataApprovalService.submitChangeRequest(userId, 'soil_data', data.id, 'create', { ...record, farmer_id: farmerId });
    }

    return data as SoilData;
  }
}

export const farmerService = new FarmerService();
