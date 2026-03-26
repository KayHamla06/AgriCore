// ============================================
// AgriCore — Test Helpers
// Mock factories for Express req/res and data
// ============================================

import { Request, Response, NextFunction } from 'express';
import { vi } from 'vitest';
import type { AuthUser } from '../models/types';

/**
 * Create a mock Express Request.
 */
export function mockRequest(overrides: Partial<Request> & { user?: AuthUser } = {}): Request {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    ...overrides,
  } as unknown as Request;
  return req;
}

/**
 * Create a mock Express Response with spied methods.
 */
export function mockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

/**
 * Create a mock NextFunction.
 */
export function mockNext(): NextFunction {
  return vi.fn() as unknown as NextFunction;
}

/**
 * Factory for a mock AuthUser.
 */
export function mockAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-123',
    email: 'test@example.com',
    role: 'farmer',
    name: 'Test User',
    ...overrides,
  };
}

/**
 * Create a chainable Supabase query mock.
 * Simulates .from('table').select().eq().single() etc.
 */
export function mockSupabaseQuery(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'lt', 'gte', 'lte',
    'like', 'ilike', 'in', 'is',
    'single', 'maybeSingle',
    'range', 'order', 'limit',
    'filter', 'match', 'not',
  ];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal methods resolve immediately
  chain['single'] = vi.fn().mockResolvedValue(result);
  chain['maybeSingle'] = vi.fn().mockResolvedValue(result);

  // select/insert/update/delete resolve if they're the last call
  for (const m of ['select', 'insert', 'update', 'delete']) {
    chain[m] = vi.fn().mockReturnValue({
      ...chain,
      then: (resolve: (val: unknown) => void) => resolve(result),
    });
  }

  return chain;
}
