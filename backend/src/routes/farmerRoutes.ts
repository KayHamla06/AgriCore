// ============================================
// AgriCore — Farmer Routes
// All routes require authentication
// Gov: full access | Farmer: own data only
// ============================================

import { Router } from 'express';
import { farmerController } from '../controllers/farmerController';
import {
  authMiddleware,
  requireRole,
  requireOwnerOrGov,
  requireVerified,
} from '../middleware';

const router = Router();

// All farmer routes require auth + verified status
router.use(authMiddleware, requireVerified);

// GET /api/farmers — list all farmers (gov only)
router.get('/', requireRole('government'), farmerController.getAll);

// GET /api/farmers/me — farmer's own profile
router.get('/me', requireRole('farmer'), farmerController.getMyProfile);

// GET /api/farmers/me/crops — farmer's own crops (token-based, no fid)
router.get('/me/crops', requireRole('farmer'), farmerController.getMyCrops);

// GET /api/farmers/me/livestock — farmer's own livestock (token-based, no fid)
router.get('/me/livestock', requireRole('farmer'), farmerController.getMyLivestock);

// GET /api/farmers/me/soil — farmer's own soil data (token-based, no fid)
router.get('/me/soil', requireRole('farmer'), farmerController.getMySoilData);

// GET /api/farmers/district/:district — farmers by district (gov only)
router.get('/district/:district', requireRole('government'), farmerController.getByDistrict);

// GET /api/farmers/:farmerId — specific farmer profile
router.get('/:farmerId', requireOwnerOrGov, farmerController.getById);

// PUT /api/farmers/:farmerId — update farmer profile
router.put('/:farmerId', requireOwnerOrGov, farmerController.updateProfile);

// --- Livestock ---
router.get('/:farmerId/livestock', requireOwnerOrGov, farmerController.getLivestock);
router.post('/:farmerId/livestock', requireOwnerOrGov, farmerController.addLivestock);

// --- Crops ---
router.get('/:farmerId/crops', requireOwnerOrGov, farmerController.getCrops);
router.post('/:farmerId/crops', requireOwnerOrGov, farmerController.addCrop);

// --- Soil Data ---
router.get('/:farmerId/soil', requireOwnerOrGov, farmerController.getSoilData);
router.post('/:farmerId/soil', requireOwnerOrGov, farmerController.addSoilData);

export default router;
