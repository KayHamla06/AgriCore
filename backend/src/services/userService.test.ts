// ============================================
// AgriCore — User Service Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../services/userService';
import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';

describe('UserService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getProfile', () => {
    it('returns user profile for advisor user', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'u1', email: 'gov@test.com', role: 'advisor', name: 'Gov' },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const profile = await userService.getProfile('u1');
      expect(profile.email).toBe('gov@test.com');
    });

    it('includes farmer profile for farmer users', async () => {
      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation((_table: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: users table
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'u2', email: 'farmer@test.com', role: 'farmer', name: 'Farm' },
              error: null,
            }),
          } as any;
        }
        // Second call: farmers table
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'f1', user_id: 'u2', farm_size_hectares: 100 },
            error: null,
          }),
        } as any;
      });

      const profile = await userService.getProfile('u2');
      expect(profile.role).toBe('farmer');
      expect(profile.farmer).toBeDefined();
      expect(profile.farmer.farm_size_hectares).toBe(100);
    });

    it('throws 404 when user not found', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(userService.getProfile('nonexistent')).rejects.toThrow(AppError);
    });
  });

  describe('updateSettings', () => {
    it('updates user settings', async () => {
      const fromChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'u1', name: 'Updated Name', phone: '123' },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const result = await userService.updateSettings('u1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });

    it('throws on update failure', async () => {
      const fromChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(userService.updateSettings('u1', { name: 'Fail' })).rejects.toThrow(AppError);
    });
  });

  describe('changePassword', () => {
    it('updates password via Supabase admin API', async () => {
      vi.mocked(supabaseAdmin.auth.admin.updateUserById).mockResolvedValue({
        data: { user: {} },
        error: null,
      } as any);

      await expect(
        userService.changePassword('auth-1', 'newpassword123')
      ).resolves.not.toThrow();

      expect(supabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith('auth-1', {
        password: 'newpassword123',
      });
    });

    it('throws on password change failure', async () => {
      vi.mocked(supabaseAdmin.auth.admin.updateUserById).mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      } as any);

      await expect(
        userService.changePassword('auth-1', 'bad')
      ).rejects.toThrow('Failed to change password');
    });
  });

  describe('deleteAccount', () => {
    it('cascading delete: cleans up all user data', async () => {
      // Mock farmers table with file references
      let callCount = 0;
      const deleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockImplementation((_table: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: get farmer profile
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'f1',
                profile_image_url: 'img.jpg',
                id_document_url: 'doc.pdf',
                farm_images: ['farm1.jpg'],
              },
              error: null,
            }),
          } as any;
        }
        return deleteChain as any;
      });

      // Mock storage removal
      vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      // Mock auth deletion
      vi.mocked(supabaseAdmin.auth.admin.deleteUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(
        userService.deleteAccount('user-del', 'auth-del')
      ).resolves.not.toThrow();

      expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('auth-del');
    });
  });
});
