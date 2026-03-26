// ============================================
// AgriCore — Validation Middleware Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { validate } from '../middleware/validateRequest';
import { mockRequest, mockResponse, mockNext } from '../__tests__/helpers';

const testSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

describe('validate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes valid body and calls next', () => {
    const middleware = validate(testSchema);
    const req = mockRequest({ body: { email: 'test@example.com', name: 'John' } });
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ email: 'test@example.com', name: 'John' });
  });

  it('strips extra fields from the body', () => {
    const middleware = validate(testSchema);
    const req = mockRequest({ body: { email: 'test@example.com', name: 'John', extra: 'data' } });
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    // Zod strips unknown keys by default
    expect(req.body.extra).toBeUndefined();
  });

  it('returns 400 for invalid body', () => {
    const middleware = validate(testSchema);
    const req = mockRequest({ body: { email: 'not-an-email', name: 'J' } });
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'name' }),
        ]),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 for missing required fields', () => {
    const middleware = validate(testSchema);
    const req = mockRequest({ body: {} });
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('validates query params when target is query', () => {
    const querySchema = z.object({ page: z.string() });
    const middleware = validate(querySchema, 'query');
    const req = mockRequest({ query: { page: '1' } } as Partial<any>);
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
