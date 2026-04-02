// ============================================
// AgriCore — Auth Service
// Handles signup, login, token refresh via Supabase Auth.
// No SMTP — Supabase handles all email flows.
// PKCE code exchange for email verification callbacks.
// ============================================

import { supabase, supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import { loginActivityService } from './loginActivityService';
import logger from '../utils/logger';
import type { AuthUser, UserRole, AuthResponse } from '../models/types';

export class AuthService {
  /**
   * Register a new user.
   * Creates Supabase Auth user + row in `users` table.
   * Supabase sends verification email automatically.
   */
  async signUp(
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<AuthResponse> {
    // Determine initial verification_status based on role
    const verificationStatus = role === 'government' ? 'pending' : 'none';

    // 1. Create auth user via public signUp — supports emailRedirectTo for branded verification link
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.APP_URL || 'https://agricore.site'}/auth/callback`,
        data: { name, role },
      },
    });

    if (authError) {
      logger.warn('SignUp: Supabase auth error', { email, error: authError.message });
      throw new AppError(authError.message, 400);
    }

    if (!authData.user) {
      throw new AppError('Email address is already registered', 400);
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
        verification_status: verificationStatus,
      })
      .select('id, email, role, name, verification_status')
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

    return {
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role as UserRole,
        name: profile.name,
        verification_status: profile.verification_status,
      },
      token: '', // No token until email is verified
    };
  }

  /**
   * Authenticate existing user.
   * Returns JWT access token + user profile + verification_status.
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

    // Fetch user profile including verification_status
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, name, verification_status')
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
        verification_status: profile.verification_status,
      },
      token: data.session.access_token,
    };
  }

  /**
   * Exchange a Supabase auth code for a session.
   * Used when Supabase redirects back after email verification (PKCE flow).
   */
  async exchangeCodeForSession(code: string): Promise<AuthResponse> {
    const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      throw new AppError('Invalid or expired auth code', 400);
    }

    // Fetch existing user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, name, verification_status')
      .eq('auth_id', data.user.id)
      .single();

    if (profileError || !profile) {
      throw new AppError('User profile not found. Please sign up first.', 404);
    }

    return {
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role as UserRole,
        name: profile.name,
        verification_status: profile.verification_status,
      },
      token: data.session.access_token,
    };
  }

  /**
   * Set user role (e.g. during onboarding).
   * If user selects 'government', set verification_status = 'pending'.
   */
  async setUserRole(userId: string, role: UserRole): Promise<void> {
    const verificationStatus = role === 'government' ? 'pending' : 'none';

    const { error } = await supabaseAdmin
      .from('users')
      .update({ role, verification_status: verificationStatus })
      .eq('id', userId);

    if (error) {
      throw new AppError('Failed to set user role', 500);
    }
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
      .select('id, email, role, name, verification_status')
      .eq('auth_id', authId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      role: data.role as UserRole,
      name: data.name,
      verification_status: data.verification_status,
    };
  }

  /**
   * Check whether an email address is already registered.
   * Returns true if the email is NOT yet taken, false if it is.
   */
  async isEmailAvailable(email: string): Promise<boolean> {
    const { count } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('email', email.toLowerCase().trim());

    return (count ?? 0) === 0;
  }
}

export const authService = new AuthService();
