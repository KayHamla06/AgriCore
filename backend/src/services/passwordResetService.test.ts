// ============================================
// AgriCore — Password Reset Service Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PasswordResetService } from '../services/passwordResetService';

// Get the mocked supabase
const mockSupabase = (await import('../config/supabaseClient')).supabaseAdmin as any;

describe('PasswordResetService', () => {
  let service: PasswordResetService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PasswordResetService();
  });

  describe('requestReset', () => {
    it('should return success even for unknown email (no info leak)', async () => {
      // User not found
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
          }),
        }),
      });

      const result = await service.requestReset('unknown@test.com');
      expect(result.message).toContain('If that email exists');
    });

    it('should create a reset token for existing user', async () => {
      const mockUser = { id: 'user-1', auth_id: 'auth-1', email: 'farmer@test.com' };

      // Chain: find user → invalidate old tokens → insert new token
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Find user
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Invalidate old tokens
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        } else {
          // Insert new token
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const result = await service.requestReset('farmer@test.com');
      expect(result.message).toContain('If that email exists');
    });
  });

  describe('resetPassword', () => {
    it('should reject invalid token', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
          }),
        }),
      });

      await expect(service.resetPassword('bad-token', 'newpass123'))
        .rejects.toThrow('Invalid or expired reset token');
    });

    it('should reject already-used token', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'reset-1', user_id: 'user-1', expires_at: new Date(Date.now() + 60000).toISOString(), used: true },
              error: null,
            }),
          }),
        }),
      });

      await expect(service.resetPassword('some-token', 'newpass123'))
        .rejects.toThrow('already been used');
    });

    it('should reject expired token', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Find token – expired
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'reset-1',
                    user_id: 'user-1',
                    expires_at: new Date(Date.now() - 60000).toISOString(),
                    used: false,
                  },
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Mark as used
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
      });

      await expect(service.resetPassword('expired-token', 'newpass123'))
        .rejects.toThrow('expired');
    });

    it('should reset password with valid token', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Find valid token
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'reset-1',
                    user_id: 'user-1',
                    expires_at: new Date(Date.now() + 600000).toISOString(),
                    used: false,
                  },
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Get user auth_id
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { auth_id: 'auth-1' },
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Mark token as used
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
      });

      // Mock Supabase auth update
      mockSupabase.auth.admin.updateUserById.mockResolvedValue({ error: null });

      await expect(service.resetPassword('valid-token', 'newSecurePass123'))
        .resolves.toBeUndefined();

      expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith('auth-1', { password: 'newSecurePass123' });
    });
  });
});
