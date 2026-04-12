// ============================================
// AgriCore — Farmer Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { farmerService } from '../services/farmerService';

export class FarmerController {
  async createFarmRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await farmerService.createFarmRecord(req.user!.id, req.body);
      res.status(201).json({ success: true, data: result, message: 'Farm record saved and synced' });
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const start = req.query.start as string | undefined;
      const end = req.query.end as string | undefined;
      const records = await farmerService.getFarmHistory(req.user!.id, start, end);
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await farmerService.getLatestAnalytics(req.user!.id);
      res.json({ success: true, data: analytics });
    } catch (err) {
      next(err);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const result = await farmerService.getAll({ page, limit });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const farmer = await farmerService.getById(req.params.farmerId);
      res.json({ success: true, data: farmer });
    } catch (err) {
      next(err);
    }
  }

  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const farmer = await farmerService.getByUserId(req.user!.id);
      res.json({ success: true, data: farmer });
    } catch (err) {
      next(err);
    }
  }

  async getMyCrops(req: Request, res: Response, next: NextFunction) {
    try {
      const farmer = await farmerService.getByUserId(req.user!.id);
      const records = await farmerService.getCrops(farmer.id);
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }

  async getMyLivestock(req: Request, res: Response, next: NextFunction) {
    try {
      const farmer = await farmerService.getByUserId(req.user!.id);
      const records = await farmerService.getLivestock(farmer.id);
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }

  async getMySoilData(req: Request, res: Response, next: NextFunction) {
    try {
      const farmer = await farmerService.getByUserId(req.user!.id);
      const records = await farmerService.getSoilData(farmer.id);
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }

  async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const farmer = await farmerService.getByUserId(req.user!.id);
      const updated = await farmerService.updateProfile(farmer.id, req.body);
      res.json({ success: true, data: updated, message: 'Profile updated' });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const farmer = await farmerService.updateProfile(req.params.farmerId, req.body);
      res.json({ success: true, data: farmer, message: 'Profile updated' });
    } catch (err) {
      next(err);
    }
  }

  async getLivestock(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await farmerService.getLivestock(req.params.farmerId);
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }

  async addLivestock(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await farmerService.addLivestock(req.params.farmerId, req.body, req.user!.id);
      res.status(201).json({ success: true, data: record, message: 'Data submitted for admin approval' });
    } catch (err) {
      next(err);
    }
  }

  async getCrops(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await farmerService.getCrops(req.params.farmerId);
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }

  async addCrop(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await farmerService.addCrop(req.params.farmerId, req.body, req.user!.id);
      res.status(201).json({ success: true, data: record, message: 'Data submitted for admin approval' });
    } catch (err) {
      next(err);
    }
  }

  async getSoilData(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await farmerService.getSoilData(req.params.farmerId);
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }

  async addSoilData(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await farmerService.addSoilData(req.params.farmerId, req.body, req.user!.id);
      res.status(201).json({ success: true, data: record, message: 'Data submitted for admin approval' });
    } catch (err) {
      next(err);
    }
  }

  async getByDistrict(req: Request, res: Response, next: NextFunction) {
    try {
      const farmers = await farmerService.getByDistrict(req.params.district);
      res.json({ success: true, data: farmers });
    } catch (err) {
      next(err);
    }
  }
}

export const farmerController = new FarmerController();
