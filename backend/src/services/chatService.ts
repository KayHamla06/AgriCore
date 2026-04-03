// ============================================
// AgriCore — Chat Service
// Internal secure messaging (1-on-1 + groups)
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';

export class ChatService {
  // ---- ROOMS ----

  async getRooms(userId: string) {
    // Get all rooms where user is a member
    const { data: memberships, error: memError } = await supabaseAdmin
      .from('chat_members')
      .select('room_id')
      .eq('user_id', userId);

    if (memError) throw new AppError('Failed to fetch chat rooms', 500);

    const roomIds = (memberships || []).map(m => m.room_id);
    if (roomIds.length === 0) return [];

    const { data: rooms, error } = await supabaseAdmin
      .from('chat_rooms')
      .select('*, members:chat_members(user_id, users:users(name, email, role))')
      .in('id', roomIds)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch chat rooms', 500);
    return rooms || [];
  }

  async createDirectMessage(userId: string, otherUserId: string) {
    // Check if DM room already exists between these two
    const { data: existing } = await supabaseAdmin
      .from('chat_members')
      .select('room_id')
      .eq('user_id', userId);

    if (existing) {
      for (const m of existing) {
        const { data: otherMember } = await supabaseAdmin
          .from('chat_members')
          .select('room_id')
          .eq('room_id', m.room_id)
          .eq('user_id', otherUserId)
          .maybeSingle();

        if (otherMember) {
          // Check it's a DM (not group)
          const { data: room } = await supabaseAdmin
            .from('chat_rooms')
            .select('*')
            .eq('id', m.room_id)
            .eq('is_group', false)
            .maybeSingle();

          if (room) return room;
        }
      }
    }

    // Create new DM room
    const { data: room, error: roomError } = await supabaseAdmin
      .from('chat_rooms')
      .insert({ is_group: false, created_by: userId })
      .select()
      .single();

    if (roomError || !room) throw new AppError('Failed to create chat room', 500);

    // Add both users as members
    const { error: memberError } = await supabaseAdmin
      .from('chat_members')
      .insert([
        { room_id: room.id, user_id: userId },
        { room_id: room.id, user_id: otherUserId },
      ]);

    if (memberError) throw new AppError('Failed to add members', 500);

    return room;
  }

  async createGroupChat(userId: string, name: string, memberIds: string[], departmentId?: string) {
    const { data: room, error: roomError } = await supabaseAdmin
      .from('chat_rooms')
      .insert({
        name,
        is_group: true,
        department_id: departmentId || null,
        created_by: userId,
      })
      .select()
      .single();

    if (roomError || !room) throw new AppError('Failed to create group', 500);

    // Add creator + all members
    const allMembers = [...new Set([userId, ...memberIds])];
    const { error: memberError } = await supabaseAdmin
      .from('chat_members')
      .insert(allMembers.map(id => ({ room_id: room.id, user_id: id })));

    if (memberError) throw new AppError('Failed to add members', 500);

    return room;
  }

  // ---- MESSAGES ----

  async getMessages(roomId: string, userId: string, limit = 50, before?: string) {
    // Verify membership
    const { data: member } = await supabaseAdmin
      .from('chat_members')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!member) throw new AppError('Not a member of this chat', 403);

    let query = supabaseAdmin
      .from('chat_messages')
      .select('*, sender:users!chat_messages_sender_id_fkey(name, email, role)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) query = query.lt('created_at', before);

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch messages', 500);
    return (data || []).reverse();
  }

  async sendMessage(roomId: string, senderId: string, content: string) {
    // Verify membership
    const { data: member } = await supabaseAdmin
      .from('chat_members')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('user_id', senderId)
      .maybeSingle();

    if (!member) throw new AppError('Not a member of this chat', 403);

    const { data: message, error } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: senderId,
        content,
      })
      .select('*, sender:users!chat_messages_sender_id_fkey(name, email, role)')
      .single();

    if (error) throw new AppError('Failed to send message', 500);
    return message;
  }
}

export const chatService = new ChatService();
