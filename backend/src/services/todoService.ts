// ============================================
// AgriCore — Todo Service
// Private personal to-do list for each user
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';

export class TodoService {
  async getAll(userId: string, includeCompleted = false) {
    let query = supabaseAdmin
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (!includeCompleted) query = query.eq('completed', false);

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch todos', 500);
    return data || [];
  }

  async getByDate(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabaseAdmin
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .order('due_date', { ascending: true });

    if (error) throw new AppError('Failed to fetch todos', 500);
    return data || [];
  }

  async create(userId: string, data: {
    title: string;
    description?: string;
    due_date?: string;
  }) {
    const { data: todo, error } = await supabaseAdmin
      .from('todos')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description || null,
        due_date: data.due_date || null,
      })
      .select()
      .maybeSingle();

    if (error) throw new AppError('Failed to create todo', 500);
    return todo;
  }

  async update(todoId: string, userId: string, updates: {
    title?: string;
    description?: string;
    due_date?: string;
  }) {
    const { data, error } = await supabaseAdmin
      .from('todos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', todoId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) throw new AppError('Failed to update todo', 500);
    return data;
  }

  async toggleComplete(todoId: string, userId: string) {
    // Get current state
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('todos')
      .select('completed')
      .eq('id', todoId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError || !existing) throw new AppError('Todo not found', 404);

    const nowCompleted = !existing.completed;
    const { data, error } = await supabaseAdmin
      .from('todos')
      .update({
        completed: nowCompleted,
        completed_at: nowCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', todoId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) throw new AppError('Failed to toggle todo', 500);
    return data;
  }

  async delete(todoId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('todos')
      .delete()
      .eq('id', todoId)
      .eq('user_id', userId);

    if (error) throw new AppError('Failed to delete todo', 500);
  }
}

export const todoService = new TodoService();
