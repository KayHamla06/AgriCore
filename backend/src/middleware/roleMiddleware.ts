// ============================================
// AgriCore — Role-Based Access Control (RBAC)
// Guards routes by user role (farmer / gov).
// Must be used AFTER authMiddleware.
// ============================================

import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../models/types';
import logger from '../utils/logger';

/**
 * Creates middleware that restricts access to specific roles.
 *
 * Usage:
 *   router.get('/farmers', authMiddleware, requireRole('government'), getFarmers);
 *   router.post('/upload', authMiddleware, requireRole('farmer'), uploadData);
 *   router.get('/plans', authMiddleware, requireRole('farmer', 'government'), getPlans);
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
 * Ensures a farmer can only access their own data.
 * Compares req.user.id against the :farmerId route param.
 * Government users bypass this check (they can view any farmer).
 *
 * Usage:
 *   router.get('/farmers/:farmerId/data', authMiddleware, requireOwnerOrGov, getData);
 */
export function requireOwnerOrGov(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  // Government, admin, and supervisor users can access any farmer's data
  if (req.user.role === 'government' || req.user.role === 'admin' || req.user.role === 'supervisor') {
    next();
    return;
  }

  // Farmers can only access their own data
  const farmerId = req.params.farmerId;
  if (farmerId && farmerId !== req.user.id) {
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
}
