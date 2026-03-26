// ============================================
// AgriCore — Input Sanitization Middleware
// Strips XSS vectors from string fields in
// request body before they reach controllers.
// ============================================

import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

/**
 * Recursively sanitizes all string values in an object.
 * Escapes HTML entities to prevent XSS.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return validator.escape(validator.trim(value));
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>);
  }
  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(val);
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
