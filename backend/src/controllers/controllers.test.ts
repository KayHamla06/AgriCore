// ============================================
// AgriCore — Controller Tests
// Tests controllers with mocked services
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authController } from '../controllers/authController';
import { userController } from '../controllers/userController';
import { mockRequest, mockResponse, mockNext, mockAuthUser } from '../__tests__/helpers';

// Mock services
vi.mock('../services/authService', () => ({
  authService: {
    signUp: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

vi.mock('../services/userService', () => ({
  userService: {
    getProfile: vi.fn(),
    updateSettings: vi.fn(),
    changePassword: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

import { authService } from '../services/authService';
import { userService } from '../services/userService';

describe('AuthController', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('signUp', () => {
    it('returns 201 with user data on success', async () => {
      vi.mocked(authService.signUp).mockResolvedValue({
        user: { id: 'u1', email: 'new@test.com', role: 'farmer', name: 'New' },
        token: 'jwt-token',
      });

      const req = mockRequest({
        body: { email: 'new@test.com', password: 'pass1234', name: 'New', role: 'farmer' },
      });
      const res = mockResponse();
      const next = mockNext();

      await authController.signUp(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Object) })
      );
    });

    it('passes errors to next', async () => {
      const error = new Error('Signup failed');
      vi.mocked(authService.signUp).mockRejectedValue(error);

      const req = mockRequest({ body: {} });
      const res = mockResponse();
      const next = mockNext();

      await authController.signUp(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('returns user data on valid login', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        user: { id: 'u1', email: 'test@test.com', role: 'farmer', name: 'Test' },
        token: 'login-token',
      });

      const req = mockRequest({ body: { email: 'test@test.com', password: 'pass1234' } });
      const res = mockResponse();
      const next = mockNext();

      await authController.login(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('me', () => {
    it('returns the current user', async () => {
      const user = mockAuthUser();
      const req = mockRequest({ user });
      const res = mockResponse();

      await authController.me(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: user });
    });
  });

  describe('refreshToken', () => {
    it('returns new session on valid refresh token', async () => {
      vi.mocked(authService.refreshToken).mockResolvedValue({
        access_token: 'new-token',
      } as any);

      const req = mockRequest({ body: { refresh_token: 'rt-123' } });
      const res = mockResponse();
      const next = mockNext();

      await authController.refreshToken(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });
});

describe('UserController', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getProfile', () => {
    it('returns profile for authenticated user', async () => {
      vi.mocked(userService.getProfile).mockResolvedValue({
        id: 'u1',
        email: 'test@test.com',
        role: 'farmer',
        name: 'Test',
      } as any);

      const req = mockRequest({ user: mockAuthUser({ id: 'u1' }) });
      const res = mockResponse();
      const next = mockNext();

      await userController.getProfile(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Object) })
      );
      expect(userService.getProfile).toHaveBeenCalledWith('u1');
    });
  });

  describe('updateSettings', () => {
    it('updates and returns settings', async () => {
      vi.mocked(userService.updateSettings).mockResolvedValue({
        id: 'u1',
        name: 'Updated',
      } as any);

      const req = mockRequest({
        user: mockAuthUser({ id: 'u1' }),
        body: { name: 'Updated' },
      });
      const res = mockResponse();
      const next = mockNext();

      await userController.updateSettings(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Settings updated' })
      );
    });
  });
});
