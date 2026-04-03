// ============================================
// AgriCore — Farmer Service
// CRUD for farmer profiles, livestock, crops, soil
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import { dataApprovalService } from './dataApprovalService';
import type {
  FarmerProfile,
  LivestockRecord,
  CropRecord,
  SoilData,
  PaginationParams,
  PaginatedResponse,
} from '../models/types';

export class FarmerService {
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
