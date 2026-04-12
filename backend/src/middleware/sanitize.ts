// ============================================
// AgriCore — Input Sanitization Middleware
// Strips XSS vectors from string fields in
// request body before they reach controllers.
// ============================================

import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

/**
 * Fields that should NOT be HTML-escaped (e.g. passwords sent to
 * external auth providers which handle their own security).
 */
const EXEMPT_FIELDS = new Set(['password', 'new_password', 'current_password', 'confirmPassword']);

function sanitizeValue(value: unknown, key?: string): unknown {
  if (typeof value === 'string') {
    // Skip HTML-escaping for exempt fields (passwords, etc.)
    if (key && EXEMPT_FIELDS.has(key)) {
      return validator.trim(value);
    }
    return validator.escape(validator.trim(value));
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v));
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>);
  }
  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(val, key);
  }
  return sanitized;
}

/**
 * Middleware that sanitizes req.body string fields.
 * Place AFTER body parsing, BEFORE validation.
 */
export function sanitizeBody(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body as Record<string, unknown>);
  }
  next();
}
