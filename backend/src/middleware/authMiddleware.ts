// ============================================
// AgriCore — JWT Authentication Middleware
// Verifies Supabase JWT tokens on every
// protected route. Attaches user to req.
// ============================================

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import logger from '../utils/logger';
import type { AuthUser, UserRole, VerificationStatus } from '../models/types';

// Extend Express Request to carry authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Extracts and verifies the JWT from the Authorization header.
 * On success, attaches `req.user` with { id, email, role, name }.
 * On failure, returns 401 Unauthorized.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or malformed authorization header' });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    // 1. Verify the token with Supabase to get the authenticated user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.warn('Auth: invalid or expired token', { error: error?.message });
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    // 2. Get role and profile from our users table
    let profile: Record<string, unknown> | null = null;
    let profileError: unknown = null;

    // Try with verification_status first; fall back without it if column missing
    const result = await supabaseAdmin
      .from('users')
      .select('id, email, role, name, verification_status')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (result.error && (result.error.code === '42703' || result.error.message?.includes('verification_status'))) {
      // verification_status column doesn't exist yet — query without it
      const fallback = await supabaseAdmin
        .from('users')
        .select('id, email, role, name')
        .eq('auth_id', user.id)
        .maybeSingle();
      profile = fallback.data;
      profileError = fallback.error;
    } else {
      profile = result.data;
      profileError = result.error;
    }

    if (profileError || !profile) {
      logger.warn('Auth: user profile not found', { authId: user.id });
      res.status(401).json({ success: false, error: 'User profile not found' });
      return;
    }

    // 3. Attach to request
    req.user = {
      id: profile.id as string,
      email: profile.email as string,
      role: profile.role as UserRole,
      name: profile.name as string,
      verification_status: (profile.verification_status as VerificationStatus) || undefined,
    };

    next();
  } catch (err) {
    logger.error('Auth middleware error', { error: err });
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

/**
 * Optional auth — attaches user if token present, but doesn't block.
 * Useful for endpoints that return different data for logged-in vs anonymous users.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('id, email, role, name, verification_status')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (profile) {
        req.user = {
          id: profile.id,
          email: profile.email,
          role: profile.role as UserRole,
          name: profile.name,
          verification_status: profile.verification_status,
        };
      }
    }
  } catch {
    // Silently continue — optional auth doesn't block
  }

  next();
}
