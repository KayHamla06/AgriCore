// ============================================
// AgriCore — Role-Based Access Control (RBAC)
// Guards routes by user role (farmer / gov).
// Must be used AFTER authMiddleware.
// ============================================

import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../models/types';
import { supabaseAdmin } from '../config/supabaseClient';
import logger from '../utils/logger';

/**
 * Creates middleware that restricts access to specific roles.
 *
 * Usage:
 *   router.get('/farmers', authMiddleware, requireRole('advisor'), getFarmers);
 *   router.post('/upload', authMiddleware, requireRole('farmer'), uploadData);
 *   router.get('/plans', authMiddleware, requireRole('farmer', 'advisor'), getPlans);
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('RBAC: access denied', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method,
      });

      res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.',
      });
      return;
    }

    next();
  };
}

/**
 * Middleware that blocks advisor users whose verification is not approved.
 * Farmers and admins pass through. Advisor users must have verification_status = 'verified'.
 *
 * Usage:
 *   router.get('/dashboard-data', authMiddleware, requireVerified, getDashboardData);
 */
export function requireVerified(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  // Only enforce verification requirement for advisor users
  const status = req.user.verification_status ?? 'unverified';
  if (req.user.role === 'advisor' && status !== 'verified' && status !== 'pending') {
    logger.warn('RBAC: unverified advisor user blocked', {
      userId: req.user.id,
      status: req.user.verification_status,
      path: req.path,
    });

    res.status(403).json({
      success: false,
      error: 'Your account is pending verification. An admin will review your application.',
      verification_status: req.user.verification_status,
    });
    return;
  }

  next();
}

/**
 * Ensures a farmer can only access their own data.
 * Looks up the farmer record by :farmerId and compares
 * its user_id against the authenticated user's id.
 * Advisor/admin/supervisor users bypass this check.
 *
 * Usage:
 *   router.get('/farmers/:farmerId/data', authMiddleware, requireOwnerOrGov, getData);
 */
export async function requireOwnerOrGov(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  // Advisor, admin, and supervisor users can access any farmer's data
  if (req.user.role === 'advisor' || req.user.role === 'admin' || req.user.role === 'supervisor') {
    next();
    return;
  }

  // Farmers can only access their own data
  const farmerId = req.params.farmerId;
  if (!farmerId) {
    next();
    return;
  }

  try {
    // Look up the farmer record to compare user_id
    const { data: farmer, error } = await supabaseAdmin
      .from('farmers')
      .select('user_id')
      .eq('id', farmerId)
      .maybeSingle();

    if (error || !farmer) {
      res.status(404).json({ success: false, error: 'Farmer not found' });
      return;
    }

    if (farmer.user_id !== req.user.id) {
      logger.warn('RBAC: farmer tried to access another farmer', {
        userId: req.user.id,
        targetFarmerId: farmerId,
        path: req.path,
      });

      res.status(403).json({
        success: false,
        error: 'You can only access your own data.',
      });
      return;
    }

    next();
  } catch {
    res.status(500).json({ success: false, error: 'Authorization check failed' });
  }
}
