// ============================================
// AgriCore — Request Validation Middleware
// Uses Zod schemas to validate body/query/params
// ============================================

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Creates middleware that validates part of the request against a Zod schema.
 *
 * Usage:
 *   router.post('/signup', validate(signUpSchema, 'body'), signUp);
 *   router.get('/farmers', validate(paginationSchema, 'query'), getFarmers);
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed; // replace with parsed (cleaned) data
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
        return;
      }

      next(err);
    }
  };
}
