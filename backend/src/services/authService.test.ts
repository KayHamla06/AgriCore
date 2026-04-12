// ============================================
// AgriCore — Auth Service Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../services/authService';
import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';

vi.mock('../services/loginActivityService', () => ({
  loginActivityService: {
    recordLogin: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('signUp', () => {
    it('creates user and returns auth response', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValue({
        data: { user: { id: 'auth-new' } },
        error: null,
      } as any);

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'user-new',
                email: 'new@test.com',
                role: 'farmer',
                name: 'New User',
                verification_status: 'none',
              },
              error: null,
            }),
          } as any;
        }

        if (table === 'farmers') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }

        throw new Error(`Unexpected table: ${table}`);
      });

      const result = await authService.signUp({
        email: ' New@Test.com ',
        password: 'password123',
        name: 'New User',
        role: 'farmer',
      });

      expect(result.user.email).toBe('new@test.com');
      expect(result.token).toBe('');
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
        authService.signUp({
          email: 'dup@test.com',
          password: 'password123',
          name: 'Dup',
          role: 'farmer',
        })
      ).rejects.toThrow(AppError);
    });

    it('rolls back auth user if profile creation fails', async () => {
      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValue({
        data: { user: { id: 'auth-rollback' } },
        error: null,
      } as any);

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'DB error' },
            }),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }

        throw new Error(`Unexpected table: ${table}`);
      });

      await expect(
        authService.signUp({
          email: 'fail@test.com',
          password: 'password123',
          name: 'Fail',
          role: 'farmer',
        })
      ).rejects.toThrow(AppError);

      expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('auth-rollback');
    });
  });

  describe('login', () => {
    it('returns auth response on valid credentials', async () => {
      vi.mocked(supabaseAdmin.auth.signInWithPassword).mockResolvedValue({
        data: { session: { access_token: 'login-token' }, user: { id: 'auth-login', email: 'login@test.com', user_metadata: {} } },
        error: null,
      } as any);

      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'user-login', email: 'login@test.com', role: 'farmer', name: 'Logged In', verification_status: 'none' },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const result = await authService.login(' Login@Test.com ', 'password123');

      expect(result.user.email).toBe('login@test.com');
      expect(result.token).toBe('login-token');
      expect(supabaseAdmin.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'login@test.com',
        password: 'password123',
      });
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

    it('checks email availability case-insensitively', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ count: 1, error: null }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(authService.isEmailAvailable(' Existing@Test.com ')).resolves.toBe(false);
      expect(fromChain.ilike).toHaveBeenCalledWith('email', 'existing@test.com');
    });
  });
});
