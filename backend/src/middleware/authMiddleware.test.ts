// ============================================
// AgriCore — Auth Middleware Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authMiddleware, optionalAuth } from '../middleware/authMiddleware';
import { supabaseAdmin } from '../config/supabaseClient';
import { mockRequest, mockResponse, mockNext } from '../__tests__/helpers';

describe('authMiddleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no Authorization header', async () => {
    const req = mockRequest({ headers: {} });
    const res = mockResponse();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Missing or malformed authorization header' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is malformed', async () => {
    const req = mockRequest({ headers: { authorization: 'Token abc' } });
    const res = mockResponse();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when token is invalid', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token', name: 'AuthApiError', status: 401 },
    } as any);

    const req = mockRequest({ headers: { authorization: 'Bearer invalid-token' } });
    const res = mockResponse();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid or expired token' })
    );
  });

  it('returns 401 when user profile not found', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: { id: 'auth-123' } },
      error: null,
    } as any);

    const fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    };
    vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

    const req = mockRequest({ headers: { authorization: 'Bearer valid-token' } });
    const res = mockResponse();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'User profile not found' })
    );
  });

  it('attaches user and calls next on success', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: { id: 'auth-123' } },
      error: null,
    } as any);

    const fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'user-123', email: 'test@test.com', role: 'farmer', name: 'Test' },
        error: null,
      }),
    };
    vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

    const req = mockRequest({ headers: { authorization: 'Bearer valid-token' } });
    const res = mockResponse();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: 'user-123',
      email: 'test@test.com',
      role: 'farmer',
      name: 'Test',
    });
  });
});

describe('optionalAuth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls next without user when no token provided', async () => {
    const req = mockRequest({ headers: {} });
    const res = mockResponse();
    const next = mockNext();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('attaches user when valid token is provided', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: { id: 'auth-456' } },
      error: null,
    } as any);

    const fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'user-456', email: 'opt@test.com', role: 'government', name: 'Gov User' },
        error: null,
      }),
    };
    vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

    const req = mockRequest({ headers: { authorization: 'Bearer token-456' } });
    const res = mockResponse();
    const next = mockNext();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: 'user-456',
      email: 'opt@test.com',
      role: 'government',
      name: 'Gov User',
    });
  });
});
