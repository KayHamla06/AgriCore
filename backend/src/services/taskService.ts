// ============================================
// AgriCore — Task Service
// Job assignment management for supervisors/admins
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import type { TaskStatus, TaskPriority } from '../models/types';

export class TaskService {
  async create(data: {
    title: string;
    description: string;
    assigned_to: string;
    assigned_by: string;
    department_id?: string;
    priority?: TaskPriority;
    deadline?: string;
  }) {
    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        title: data.title,
        description: data.description || '',
        assigned_to: data.assigned_to,
        assigned_by: data.assigned_by,
        department_id: data.department_id || null,
        priority: data.priority || 'medium',
        deadline: data.deadline || null,
      })
      .select()
      .maybeSingle();

    if (error) {
      logger.error('Task creation failed', { error: error.message });
      throw new AppError('Failed to create task', 500);
    }

    return task;
  }

  async getAssignedTo(userId: string, status?: TaskStatus) {
    let query = supabaseAdmin
      .from('tasks')
      .select('*, assigned_by_user:users!tasks_assigned_by_fkey(name, email, role)')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch tasks', 500);
    return data || [];
  }

  async getAssignedBy(userId: string, status?: TaskStatus) {
    let query = supabaseAdmin
      .from('tasks')
      .select('*, assigned_to_user:users!tasks_assigned_to_fkey(name, email, role)')
      .eq('assigned_by', userId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch tasks', 500);
    return data || [];
  }

  async getById(taskId: string) {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*, assigned_to_user:users!tasks_assigned_to_fkey(name, email, role), assigned_by_user:users!tasks_assigned_by_fkey(name, email, role)')
      .eq('id', taskId)
      .maybeSingle();

    if (error || !data) throw new AppError('Task not found', 404);
    return data;
  }

  async updateStatus(
    taskId: string,
    userId: string,
    status: TaskStatus
  ) {
    // Verify user is assignee or assigner
    const task = await this.getById(taskId);
    if (task.assigned_to !== userId && task.assigned_by !== userId) {
      throw new AppError('Not authorized to update this task', 403);
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .maybeSingle();

    if (error) throw new AppError('Failed to update task', 500);
    return data;
  }

  async update(taskId: string, userId: string, updates: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    deadline?: string;
  }) {
    const task = await this.getById(taskId);
    if (task.assigned_by !== userId) {
      throw new AppError('Only the assigner can edit task details', 403);
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .maybeSingle();

    if (error) throw new AppError('Failed to update task', 500);
    return data;
  }

  async delete(taskId: string, userId: string) {
    const task = await this.getById(taskId);
    if (task.assigned_by !== userId) {
      throw new AppError('Only the assigner can delete a task', 403);
    }

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw new AppError('Failed to delete task', 500);
  }

  async getDepartmentTasks(departmentId: string, status?: TaskStatus) {
    let query = supabaseAdmin
      .from('tasks')
      .select('*, assigned_to_user:users!tasks_assigned_to_fkey(name, email, role), assigned_by_user:users!tasks_assigned_by_fkey(name, email, role)')
      .eq('department_id', departmentId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch department tasks', 500);
    return data || [];
  }
}

export const taskService = new TaskService();
