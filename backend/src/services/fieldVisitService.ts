// ============================================
// AgriCore — Field Visit Service
// Farm visit logging with GPS, images, sharing
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';

export class FieldVisitService {
  async getAll(userId: string, userRole: string) {
    let query = supabaseAdmin
      .from('field_visits')
      .select('*, agent:users!field_visits_agent_id_fkey(name, email, role)')
      .order('visit_date', { ascending: false });

    // Admins/supervisors see all; agents see own + shared
    if (userRole !== 'admin' && userRole !== 'supervisor') {
      query = query.or(`agent_id.eq.${userId},shared_with.cs.{${userId}}`);
    }

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch visits', 500);
    return data || [];
  }

  async getById(visitId: string, userId: string, userRole: string) {
    const { data, error } = await supabaseAdmin
      .from('field_visits')
      .select('*, agent:users!field_visits_agent_id_fkey(name, email, role)')
      .eq('id', visitId)
      .single();

    if (error || !data) throw new AppError('Visit not found', 404);

    // Check access
    if (
      userRole !== 'admin' && userRole !== 'supervisor' &&
      data.agent_id !== userId &&
      !data.shared_with?.includes(userId)
    ) {
      throw new AppError('Access denied', 403);
    }

    return data;
  }

  async create(agentId: string, data: {
    farmer_id?: string;
    visit_date?: string;
    location_lat?: number;
    location_lng?: number;
    location_name?: string;
    notes: string;
    images?: string[];
  }) {
    const { data: visit, error } = await supabaseAdmin
      .from('field_visits')
      .insert({
        agent_id: agentId,
        farmer_id: data.farmer_id || null,
        visit_date: data.visit_date || new Date().toISOString(),
        location_lat: data.location_lat || null,
        location_lng: data.location_lng || null,
        location_name: data.location_name || null,
        notes: data.notes,
        images: data.images || [],
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to log visit', 500);
    return visit;
  }

  async update(visitId: string, agentId: string, updates: {
    notes?: string;
    location_name?: string;
    images?: string[];
  }) {
    const { data, error } = await supabaseAdmin
      .from('field_visits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', visitId)
      .eq('agent_id', agentId)
      .select()
      .single();

    if (error) throw new AppError('Failed to update visit', 500);
    return data;
  }

  async share(visitId: string, agentId: string, shareWith: string[]) {
    const { data: visit, error: fetchError } = await supabaseAdmin
      .from('field_visits')
      .select('agent_id')
      .eq('id', visitId)
      .single();

    if (fetchError || !visit) throw new AppError('Visit not found', 404);
    if (visit.agent_id !== agentId) throw new AppError('Only the agent can share visits', 403);

    const { data, error } = await supabaseAdmin
      .from('field_visits')
      .update({
        shared_with: shareWith,
        updated_at: new Date().toISOString(),
      })
      .eq('id', visitId)
      .select()
      .single();

    if (error) throw new AppError('Failed to share visit', 500);
    return data;
  }

  async delete(visitId: string, agentId: string) {
    const { error } = await supabaseAdmin
      .from('field_visits')
      .delete()
      .eq('id', visitId)
      .eq('agent_id', agentId);

    if (error) throw new AppError('Failed to delete visit', 500);
  }
}

export const fieldVisitService = new FieldVisitService();
