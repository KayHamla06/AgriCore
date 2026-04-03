// ============================================
// AgriCore — Plan Service
// CRUD for support plans (farmer + gov)
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import type { SupportPlan, UserRole } from '../models/types';

export class PlanService {
  /**
   * Get all plans (gov only — for the plans table).
   */
  async getAll(): Promise<SupportPlan[]> {
    const { data, error } = await supabaseAdmin
      .from('support_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch plans', 500);
    return data as SupportPlan[];
  }

  /**
   * Get plans for a specific farmer.
   * Can filter by creator role (farmer's own plans vs gov plans).
   */
  async getByFarmerId(
    farmerId: string,
    createdByRole?: UserRole
  ): Promise<SupportPlan[]> {
    let query = supabaseAdmin
      .from('support_plans')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    if (createdByRole) {
      query = query.eq('created_by_role', createdByRole);
    }

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch farmer plans', 500);
    return data as SupportPlan[];
  }

  /**
   * Get a single plan by ID.
   */
  async getById(planId: string): Promise<SupportPlan> {
    const { data, error } = await supabaseAdmin
      .from('support_plans')
      .select('*')
      .eq('id', planId)
      .maybeSingle();

    if (error || !data) throw new AppError('Plan not found', 404);
    return data as SupportPlan;
  }

  /**
   * Create a new plan.
   * Farmers create their own plans; gov creates support plans for farmers.
   */
  async create(plan: {
    farmer_id: string;
    created_by: string;
    created_by_role: UserRole;
    type: string;
    objectives: string;
    budget: number;
    timeline: string;
    status: SupportPlan['status'];
    approval_status: SupportPlan['approval_status'];
  }): Promise<SupportPlan> {
    const { data, error } = await supabaseAdmin
      .from('support_plans')
      .insert(plan)
      .select()
      .maybeSingle();

    if (error) throw new AppError('Failed to create plan', 500);
    return data as SupportPlan;
  }

  /**
   * Update a plan (status, approval, etc).
   */
  async update(
    planId: string,
    updates: Partial<SupportPlan>
  ): Promise<SupportPlan> {
    const { id: _id, created_at: _ca, ...safeUpdates } = updates as Record<string, unknown>;

    const { data, error } = await supabaseAdmin
      .from('support_plans')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .select()
      .maybeSingle();

    if (error) throw new AppError('Failed to update plan', 500);
    return data as SupportPlan;
  }

  /**
   * Approve a plan (gov action).
   */
  async approve(planId: string): Promise<SupportPlan> {
    return this.update(planId, {
      approval_status: 'Approved',
      approved_date: new Date().toISOString().split('T')[0],
      status: 'Active',
    } as Partial<SupportPlan>);
  }

  /**
   * Reject a plan (gov action).
   */
  async reject(planId: string): Promise<SupportPlan> {
    return this.update(planId, {
      approval_status: 'Rejected',
    } as Partial<SupportPlan>);
  }

  /**
   * Delete a plan.
   * Only draft plans can be deleted by their creator.
   */
  async delete(planId: string, requesterId: string): Promise<void> {
    const plan = await this.getById(planId);

    if (plan.created_by !== requesterId && plan.farmer_id !== requesterId) {
      throw new AppError('You can only delete your own plans', 403);
    }

    if (plan.status !== 'Draft') {
      throw new AppError('Only draft plans can be deleted', 400);
    }

    const { error } = await supabaseAdmin
      .from('support_plans')
      .delete()
      .eq('id', planId);

    if (error) throw new AppError('Failed to delete plan', 500);
  }
}

export const planService = new PlanService();
