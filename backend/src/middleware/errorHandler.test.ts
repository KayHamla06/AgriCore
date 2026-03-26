// ============================================
// AgriCore — Error Handler Middleware Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, errorHandler, notFoundHandler } from '../middleware/errorHandler';
import { mockRequest, mockResponse, mockNext } from '../__tests__/helpers';

describe('AppError', () => {
  it('creates an operational error with status code', () => {
    const error = new AppError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
    expect(error).toBeInstanceOf(Error);
  });

  it('supports non-operational errors', () => {
    const error = new AppError('Internal failure', 500, false);
    expect(error.isOperational).toBe(false);
  });
});

describe('errorHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('handles AppError with correct status code', () => {
    const err = new AppError('Resource not found', 404);
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Resource not found',
    });
  });

  it('handles generic errors with 500 status', () => {
    const err = new Error('Something broke');
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});

describe('notFoundHandler', () => {
  it('returns 404 with route info', () => {
    const req = mockRequest({ method: 'GET', path: '/api/nonexistent' } as Partial<any>);
    const res = mockResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Route GET /api/nonexistent not found',
    });
  });
});
