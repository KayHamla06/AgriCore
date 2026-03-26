// ============================================
// AgriCore — Auth Service
// Handles signup, login, token refresh via Supabase Auth
// ============================================

import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import { loginActivityService } from './loginActivityService';
import logger from '../utils/logger';
import type { AuthUser, UserRole, AuthResponse } from '../models/types';

export class AuthService {
  /**
   * Register a new user.
   * Creates Supabase Auth user + row in `users` table.
   */
  async signUp(
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<AuthResponse> {
    // 1. Create auth user in Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm for dev; remove in production
      user_metadata: { name, role },
    });

    if (authError) {
      logger.warn('SignUp: Supabase auth error', { email, error: authError.message });
      throw new AppError(authError.message, 400);
    }

    const authUser = authData.user;

    // 2. Create profile row in users table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authUser.id,
        email,
        name,
        role,
      })
      .select('id, email, role, name')
      .single();

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      logger.error('SignUp: profile creation failed, rolled back auth user', {
        authId: authUser.id,
        error: profileError.message,
      });
      throw new AppError('Failed to create user profile', 500);
    }

    // Sign in to get a real session token
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      logger.error('SignUp: could not generate session after creation', {
        email,
        error: signInError?.message,
      });
      throw new AppError('Account created but failed to generate session', 500);
    }

    return {
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role as UserRole,
        name: profile.name,
      },
      token: signInData.session.access_token,
    };
  }

  /**
   * Authenticate existing user.
   * Returns JWT access token + user profile.
   */
  async login(
    email: string,
    password: string,
    meta?: { ip_address?: string; user_agent?: string }
  ): Promise<AuthResponse> {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      throw new AppError('Invalid email or password', 401);
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, name')
      .eq('auth_id', data.user.id)
      .single();

    if (profileError || !profile) {
      throw new AppError('User profile not found', 401);
    }

    // Record login activity (non-blocking)
    loginActivityService.recordLogin({
      user_id: profile.id,
      ip_address: meta?.ip_address,
      user_agent: meta?.user_agent,
    });

    return {
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role as UserRole,
        name: profile.name,
      },
      token: data.session.access_token,
    };
  }

  /**
   * Refresh an existing session token.
   */
  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new AppError('Failed to refresh token', 401);
    }

    return { token: data.session.access_token };
  }

  /**
   * Sign out — invalidates the session server-side.
   */
  async logout(token: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.signOut(token);
    if (error) {
      logger.warn('Logout: error invalidating session', { error: error.message });
    }
  }

  /**
   * Get user profile by auth ID.
   */
  async getUserByAuthId(authId: string): Promise<AuthUser | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, name')
      .eq('auth_id', authId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      role: data.role as UserRole,
      name: data.name,
    };
  }
}

export const authService = new AuthService();
