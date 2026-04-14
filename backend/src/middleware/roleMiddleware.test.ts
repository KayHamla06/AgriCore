// ============================================
// AgriCore — Role Middleware Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireRole, requireOwnerOrGov } from '../middleware/roleMiddleware';
import { mockRequest, mockResponse, mockNext, mockAuthUser } from '../__tests__/helpers';

// Mock supabaseAdmin
vi.mock('../config/supabaseClient', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { supabaseAdmin } from '../config/supabaseClient';

function mockSupabaseFarmerLookup(result: { data: any; error: any }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  return chain;
}

describe('requireRole', () => {
  beforeEach(() => vi.clearAllMocks());

  it('allows access when user has an allowed role', () => {
    const middleware = requireRole('farmer');
    const req = mockRequest({ user: mockAuthUser({ role: 'farmer' }) });
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows access when user has one of multiple allowed roles', () => {
    const middleware = requireRole('farmer', 'advisor');
    const req = mockRequest({ user: mockAuthUser({ role: 'advisor' }) });
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('denies access when user role is not allowed', () => {
    const middleware = requireRole('advisor');
    const req = mockRequest({ user: mockAuthUser({ role: 'farmer' }) });
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Access denied. Insufficient permissions.' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when no user attached', () => {
    const middleware = requireRole('farmer');
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('requireOwnerOrGov', () => {
  beforeEach(() => vi.clearAllMocks());

  it('allows advisor users to access any farmer data', () => {
    const req = mockRequest({
      user: mockAuthUser({ role: 'advisor' }),
      params: { farmerId: 'other-farmer-id' },
    });
    const res = mockResponse();
    const next = mockNext();

    requireOwnerOrGov(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('allows farmer to access their own data', async () => {
    mockSupabaseFarmerLookup({ data: { user_id: 'user-1' }, error: null });

    const req = mockRequest({
      user: mockAuthUser({ id: 'user-1', role: 'farmer' }),
      params: { farmerId: 'farmer-record-1' },
    });
    const res = mockResponse();
    const next = mockNext();

    requireOwnerOrGov(req, res, next);

    // Wait for async DB lookup
    await vi.waitFor(() => {
      expect(next).toHaveBeenCalled();
    });
  });

  it('blocks farmer from accessing other farmer data', async () => {
    mockSupabaseFarmerLookup({ data: { user_id: 'user-2' }, error: null });

    const req = mockRequest({
      user: mockAuthUser({ id: 'user-1', role: 'farmer' }),
      params: { farmerId: 'farmer-record-2' },
    });
    const res = mockResponse();
    const next = mockNext();

    requireOwnerOrGov(req, res, next);

    await vi.waitFor(() => {
      expect(res.status).toHaveBeenCalledWith(403);
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 when farmer record not found', async () => {
    mockSupabaseFarmerLookup({ data: null, error: null });

    const req = mockRequest({
      user: mockAuthUser({ id: 'user-1', role: 'farmer' }),
      params: { farmerId: 'nonexistent' },
    });
    const res = mockResponse();
    const next = mockNext();

    requireOwnerOrGov(req, res, next);

    await vi.waitFor(() => {
      expect(res.status).toHaveBeenCalledWith(404);
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when no user attached', () => {
    const req = mockRequest({ params: { farmerId: 'any' } });
    const res = mockResponse();
    const next = mockNext();

    requireOwnerOrGov(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
