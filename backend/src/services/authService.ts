// ============================================
// AgriCore — Auth Service
// Handles signup, login, token refresh via Supabase Auth.
// No SMTP — Supabase handles all email flows.
// PKCE code exchange for email verification callbacks.
// ============================================

import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin, supabaseAnonKey, supabaseUrl } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import { loginActivityService } from './loginActivityService';
import logger from '../utils/logger';
import type { AuthUser, UserRole, AuthResponse, SignUpRequest } from '../models/types';

type ProfileRow = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  verification_status: 'none' | 'pending' | 'verified' | 'rejected';
};

export class AuthService {
  private createAuthClient() {
    return createClient(supabaseUrl || '', supabaseAnonKey || '', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  private normalizeEmail(email?: string | null): string {
    return String(email || '').trim().toLowerCase();
  }

  private async ensureFarmerProfile(userId: string, profile: { name: string; email: string }, details?: { province?: string; district?: string; farmSize?: string | number }): Promise<void> {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('farmers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      throw new AppError('Failed to check farmer profile', 500);
    }

    if (existing) {
      return;
    }

    const farmSizeValue = typeof details?.farmSize === 'number'
      ? details.farmSize
      : parseFloat(details?.farmSize || '0');

    const { error: farmerError } = await supabaseAdmin
      .from('farmers')
      .insert({
        user_id: userId,
        name: profile.name,
        email: profile.email,
        province: details?.province?.trim() || 'Unknown',
        district: details?.district?.trim() || 'Unknown',
        farm_size_hectares: Number.isFinite(farmSizeValue) ? farmSizeValue : 0,
      });

    if (farmerError) {
      throw new AppError('Failed to create farmer profile', 500);
    }
  }

  private isUserRole(value: unknown): value is UserRole {
    return ['farmer', 'advisor', 'admin', 'supervisor', 'field_agent', 'office_staff'].includes(
      String(value)
    );
  }

  /**
   * Ensure a row exists in public.users for this Supabase Auth user.
   * This repairs out-of-sync auth/database states without blocking login.
   */
  private async getOrCreateProfile(authUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  }): Promise<ProfileRow> {
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, email, role, name, verification_status')
      .eq('auth_id', authUser.id)
      .maybeSingle();

    if (existing) {
      return existing as ProfileRow;
    }

    const metadata = authUser.user_metadata || {};
    const roleFromMeta = metadata.role;
    const role: UserRole = this.isUserRole(roleFromMeta) ? roleFromMeta : 'farmer';

    const nameFromMeta = metadata.name;
    const email = this.normalizeEmail(authUser.email);
    const fallbackName = email ? email.split('@')[0] : 'New User';
    const name = (typeof nameFromMeta === 'string' && nameFromMeta.trim()) ? nameFromMeta.trim() : fallbackName;

    const verificationStatus = role === 'advisor' ? 'pending' : 'none';

    const { data: created, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authUser.id,
        email,
        name,
        role,
        verification_status: verificationStatus,
      })
      .select('id, email, role, name, verification_status')
      .maybeSingle();

    if (createError || !created) {
      logger.error('Auth sync: failed to auto-create missing users profile', {
        authId: authUser.id,
        email,
        error: createError?.message,
      });
      throw new AppError('User profile not found', 401);
    }

    logger.info('Auth sync: auto-created missing users profile', {
      authId: authUser.id,
      userId: created.id,
      role: created.role,
    });

    if (created.role === 'farmer') {
      await this.ensureFarmerProfile(created.id, {
        name: created.name,
        email: created.email,
      });
    }

    return created as ProfileRow;
  }

  /**
   * Register a new user.
   * Creates Supabase Auth user + row in `users` table.
   * Supabase sends verification email automatically.
   */
  async signUp(payload: SignUpRequest): Promise<AuthResponse> {
    const { password, name, role, province, district, farmSize } = payload;
    const email = this.normalizeEmail(payload.email);

    // Advisors need admin approval, everyone else just needs email verification
    const verificationStatus = role === 'advisor' ? 'pending' : 'none';

    // 1. Create auth user — email_confirm: false so Supabase sends verification
    //    email automatically. The on_auth_user_created trigger must be dropped
    //    so it doesn't conflict with our manual public.users insert below.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { name, role },
    });

    if (authError) {
      logger.warn('SignUp: Supabase auth error', { email, error: authError.message });

      if (
        authError.message.toLowerCase().includes('already') ||
        authError.message.toLowerCase().includes('exists') ||
        authError.message.toLowerCase().includes('duplicate')
      ) {
        throw new AppError('This email address is already registered.', 409);
      }

      throw new AppError(authError.message, 400);
    }

    if (!authData.user) {
      throw new AppError('Email address is already registered', 400);
    }

    const authUser = authData.user;

    // 2. Send verification email (admin.createUser doesn't send it automatically)
    try {
      const authClient = this.createAuthClient();
      await authClient.auth.resend({ type: 'signup', email });
      logger.info('SignUp: verification email sent', { email });
    } catch (emailErr) {
      logger.warn('SignUp: verification email failed (user can resend later)', {
        email,
        error: (emailErr as Error).message,
      });
    }

    // 3. Create profile row in users table
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
      .maybeSingle();

    if (profileError || !profile) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      logger.error('SignUp: profile creation failed, rolled back auth user', {
        authId: authUser.id,
        error: profileError?.message,
      });
      throw new AppError('Failed to create user profile', 500);
    }

    // 3. Create farmer profile if role is farmer
    try {
      if (profile.role === 'farmer') {
        await this.ensureFarmerProfile(profile.id, {
          name: profile.name,
          email: profile.email,
        }, {
          province,
          district,
          farmSize,
        });
      }
    } catch (farmerProfileError) {
      await supabaseAdmin.from('users').delete().eq('id', profile.id);
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      throw farmerProfileError;
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
    const normalizedEmail = this.normalizeEmail(email);
    const authClient = this.createAuthClient();

    const { data, error } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });



    if (error || !data.user || !data.session) {
      const authError = error as { message?: string; status?: number; code?: string } | null;
      const errorStatus = authError?.status;
      const errorMessage = (authError?.message || '').toLowerCase();

      logger.warn('Supabase login failed', {
        email: normalizedEmail,
        status: errorStatus,
        code: authError?.code,
        message: authError?.message || 'No error message',
      });

      // Give a specific message for unconfirmed emails
      if (errorMessage.includes('email not confirmed') || errorMessage.includes('not confirmed')) {
        throw new AppError('Please verify your email address before logging in. Check your inbox for the verification link.', 403);
      }

      throw new AppError('Invalid email or password', 401);
    }

    // Fetch (or auto-create) user profile including verification_status
    const profile = await this.getOrCreateProfile({
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata as Record<string, unknown> | null,
    });

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
    const authClient = this.createAuthClient();
    const { data, error } = await authClient.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      throw new AppError('Invalid or expired auth code', 400);
    }

    // Fetch (or auto-create) user profile
    const profile = await this.getOrCreateProfile({
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata as Record<string, unknown> | null,
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
   * Set user role (e.g. during onboarding).
   * If user selects 'advisor', set verification_status = 'pending'.
   */
  async setUserRole(userId: string, role: UserRole): Promise<void> {
    const verificationStatus = role === 'advisor' ? 'pending' : 'none';

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
    const authClient = this.createAuthClient();
    const { data, error } = await authClient.auth.refreshSession({
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
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, email, role, name, verification_status')
      .eq('auth_id', authId)
      .maybeSingle();

    if (!data) return null;

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
    const normalizedEmail = this.normalizeEmail(email);

    const { count, error } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .ilike('email', normalizedEmail);

    if (error) {
      throw new AppError('Failed to check email availability', 500);
    }

    return (count ?? 0) === 0;
  }
}

export const authService = new AuthService();
