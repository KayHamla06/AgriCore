// ============================================
// AgriCore — Auth Service Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../services/authService';
import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';

describe('AuthService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('signUp', () => {
    it('creates user and returns auth response', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValue({
        data: { user: { id: 'auth-new' } },
        error: null,
      } as any);

      const fromChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-new', email: 'new@test.com', role: 'farmer', name: 'New User' },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      vi.mocked(supabaseAdmin.auth.signInWithPassword).mockResolvedValue({
        data: { session: { access_token: 'jwt-token-123' } },
        error: null,
      } as any);

      const result = await authService.signUp('new@test.com', 'password123', 'New User', 'farmer');

      expect(result.user.email).toBe('new@test.com');
      expect(result.token).toBe('jwt-token-123');
      expect(supabaseAdmin.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@test.com' })
      );
    });

    it('throws on auth creation failure', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'User already exists' },
      } as any);

      await expect(
        authService.signUp('dup@test.com', 'password123', 'Dup', 'farmer')
      ).rejects.toThrow(AppError);
    });

    it('rolls back auth user if profile creation fails', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValue({
        data: { user: { id: 'auth-rollback' } },
        error: null,
      } as any);

      const fromChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'DB error' },
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(
        authService.signUp('fail@test.com', 'password123', 'Fail', 'farmer')
      ).rejects.toThrow(AppError);

      expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('auth-rollback');
    });
  });

  describe('login', () => {
    it('returns auth response on valid credentials', async () => {
      vi.mocked(supabaseAdmin.auth.signInWithPassword).mockResolvedValue({
        data: { session: { access_token: 'login-token' }, user: { id: 'auth-login' } },
        error: null,
      } as any);

      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-login', email: 'login@test.com', role: 'farmer', name: 'Logged In' },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const result = await authService.login('login@test.com', 'password123');

      expect(result.user.email).toBe('login@test.com');
      expect(result.token).toBe('login-token');
    });

    it('throws on invalid credentials', async () => {
      vi.mocked(supabaseAdmin.auth.signInWithPassword).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login' },
      } as any);

      await expect(
        authService.login('bad@test.com', 'wrong')
      ).rejects.toThrow('Invalid email or password');
    });
  });
});
