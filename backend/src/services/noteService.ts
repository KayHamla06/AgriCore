// ============================================
// AgriCore — Notes Service
// Personal & shareable notes
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';

export class NoteService {
  async getAll(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('notes')
      .select('*')
      .or(`user_id.eq.${userId},shared_with.cs.{${userId}}`)
      .order('updated_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch notes', 500);
    return data || [];
  }

  async getById(noteId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (error || !data) throw new AppError('Note not found', 404);

    // Check access
    if (data.user_id !== userId && !(data.is_shared && data.shared_with?.includes(userId))) {
      throw new AppError('Access denied', 403);
    }

    return data;
  }

  async create(userId: string, data: {
    title: string;
    content?: string;
  }) {
    const { data: note, error } = await supabaseAdmin
      .from('notes')
      .insert({
        user_id: userId,
        title: data.title,
        content: data.content || '',
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create note', 500);
    return note;
  }

  async update(noteId: string, userId: string, updates: {
    title?: string;
    content?: string;
  }) {
    const { data, error } = await supabaseAdmin
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', noteId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new AppError('Failed to update note', 500);
    return data;
  }

  async share(noteId: string, userId: string, shareWith: string[]) {
    // Verify ownership
    const { data: note, error: fetchError } = await supabaseAdmin
      .from('notes')
      .select('user_id')
      .eq('id', noteId)
      .single();

    if (fetchError || !note) throw new AppError('Note not found', 404);
    if (note.user_id !== userId) throw new AppError('Only the owner can share notes', 403);

    const { data, error } = await supabaseAdmin
      .from('notes')
      .update({
        is_shared: shareWith.length > 0,
        shared_with: shareWith,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw new AppError('Failed to share note', 500);
    return data;
  }

  async delete(noteId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) throw new AppError('Failed to delete note', 500);
  }
}

export const noteService = new NoteService();
