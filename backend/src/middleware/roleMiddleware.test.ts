// ============================================
// AgriCore — Role Middleware Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireRole, requireOwnerOrGov } from '../middleware/roleMiddleware';
import { mockRequest, mockResponse, mockNext, mockAuthUser } from '../__tests__/helpers';

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
    const middleware = requireRole('farmer', 'government');
    const req = mockRequest({ user: mockAuthUser({ role: 'government' }) });
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('denies access when user role is not allowed', () => {
    const middleware = requireRole('government');
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

  it('allows government users to access any farmer data', () => {
    const req = mockRequest({
      user: mockAuthUser({ role: 'government' }),
      params: { farmerId: 'other-farmer-id' },
    });
    const res = mockResponse();
    const next = mockNext();

    requireOwnerOrGov(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('allows farmer to access their own data', () => {
    const req = mockRequest({
      user: mockAuthUser({ id: 'farmer-1', role: 'farmer' }),
      params: { farmerId: 'farmer-1' },
    });
    const res = mockResponse();
    const next = mockNext();

    requireOwnerOrGov(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('blocks farmer from accessing other farmer data', () => {
    const req = mockRequest({
      user: mockAuthUser({ id: 'farmer-1', role: 'farmer' }),
      params: { farmerId: 'farmer-2' },
    });
    const res = mockResponse();
    const next = mockNext();

    requireOwnerOrGov(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
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
