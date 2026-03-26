// ============================================
// AgriCore — Verification Controller
// Handles verification document uploads,
// status checks, and admin review actions.
// ============================================

import { Request, Response, NextFunction } from 'express';
import { verificationService } from '../services/verificationService';

export class VerificationController {
  /**
   * POST /api/verification/upload
   * Upload a verification document.
   */
  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file provided' });
        return;
      }

      const { documentType } = req.body;
      if (!documentType) {
        res.status(400).json({ success: false, error: 'documentType is required' });
        return;
      }

      const doc = await verificationService.uploadDocument(
        req.user!.id,
        documentType,
        req.file
      );

      res.status(201).json({ success: true, data: doc, message: 'Document uploaded for review' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/verification/my-documents
   * Get the current user's verification documents.
   */
  async getMyDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const docs = await verificationService.getUserDocuments(req.user!.id);
      res.json({ success: true, data: docs });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/verification/status
   * Get the current user's verification status & documents.
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await verificationService.getStatus(req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/verification/pending
   * Admin: get all pending verification requests.
   */
  async getPending(_req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await verificationService.getPendingRequests();
      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/verification/all
   * Admin: get all verification requests with optional status filter.
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const requests = await verificationService.getAllRequests(status as any);
      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/verification/:userId/approve
   * Admin: approve a user's verification.
   */
  async approveUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { notes } = req.body;

      await verificationService.approveUser(userId, req.user!.id, notes);
      res.json({ success: true, message: 'User verification approved' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/verification/:userId/reject
   * Admin: reject a user's verification.
   */
  async rejectUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { notes } = req.body;

      await verificationService.rejectUser(userId, req.user!.id, notes);
      res.json({ success: true, message: 'User verification rejected' });
    } catch (err) {
      next(err);
    }
  }
}

export const verificationController = new VerificationController();
