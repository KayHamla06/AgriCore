// ============================================
// AgriCore — Upload Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { uploadService } from '../services/uploadService';
import { AppError } from '../middleware/errorHandler';

export class UploadController {
  async uploadFarmImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new AppError('No file provided', 400);

      const url = await uploadService.uploadFarmImage(req.params.farmerId, req.file);
      res.status(201).json({ success: true, data: { url }, message: 'Farm image uploaded' });
    } catch (err) {
      next(err);
    }
  }

  async uploadIdDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new AppError('No file provided', 400);

      const url = await uploadService.uploadIdDocument(req.params.farmerId, req.file);
      res.status(201).json({ success: true, data: { url }, message: 'ID document uploaded' });
    } catch (err) {
      next(err);
    }
  }

  async uploadProfileImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new AppError('No file provided', 400);

      const url = await uploadService.uploadProfileImage(req.params.farmerId, req.file);
      res.status(201).json({ success: true, data: { url }, message: 'Profile image uploaded' });
    } catch (err) {
      next(err);
    }
  }
}

export const uploadController = new UploadController();
