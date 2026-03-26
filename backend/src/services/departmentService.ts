// ============================================
// AgriCore — Department Service
// Department management
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';

export class DepartmentService {
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new AppError('Failed to fetch departments', 500);
    return data || [];
  }

  async getById(departmentId: string) {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('id', departmentId)
      .single();

    if (error || !data) throw new AppError('Department not found', 404);
    return data;
  }

  async getMembers(departmentId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, profile_image_url')
      .eq('department_id', departmentId)
      .order('name', { ascending: true });

    if (error) throw new AppError('Failed to fetch department members', 500);
    return data || [];
  }

  async create(name: string, description: string) {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .insert({ name, description })
      .select()
      .single();

    if (error) throw new AppError('Failed to create department', 500);
    return data;
  }

  async update(departmentId: string, updates: { name?: string; description?: string }) {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .update(updates)
      .eq('id', departmentId)
      .select()
      .single();

    if (error) throw new AppError('Failed to update department', 500);
    return data;
  }

  async assignUser(userId: string, departmentId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ department_id: departmentId })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new AppError('Failed to assign user to department', 500);
    return data;
  }
}

export const departmentService = new DepartmentService();
