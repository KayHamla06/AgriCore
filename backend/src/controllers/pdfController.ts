// ============================================
// AgriCore — PDF Controller
// Handles PDF report generation requests.
// ============================================

import { Request, Response, NextFunction } from 'express';
import { pdfService } from '../services/pdfService';

export class PdfController {
  /**
   * GET /api/pdf/farmer/:farmerId
   * Generate and stream a farmer report PDF.
   */
  async getFarmerReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { farmerId } = req.params;

      const doc = await pdfService.generateFarmerReport(
        farmerId,
        req.user!.id,
        req.user!.role
      );

      const filename = `AgriCore_Farm_Report_${farmerId.slice(0, 8)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/pdf/plans/:farmerId
   * Generate and stream a support plan report PDF.
   */
  async getPlanReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { farmerId } = req.params;

      const doc = await pdfService.generatePlanReport(
        farmerId,
        req.user!.id,
        req.user!.role
      );

      const filename = `AgriCore_Plan_Report_${farmerId.slice(0, 8)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/pdf/compare
   * Generate a multi-farmer comparison PDF.
   * Body: { farmerIds: string[], dataTypes: string[], timeRange: { from?: string, to?: string } }
   */
  async getComparisonReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { farmerIds, dataTypes, timeRange } = req.body;

      const doc = await pdfService.generateComparisonReport(
        farmerIds,
        dataTypes || ['livestock', 'crops', 'soil'],
        timeRange || {},
        req.user!.id,
        req.user!.role
      );

      const filename = `AgriCore_Comparison_Report_${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/pdf/export
   * Generate a filtered data export PDF.
   * Body: { farmerId: string, fields: string[], timeRange: { from?: string, to?: string } }
   */
  async getFilteredExport(req: Request, res: Response, next: NextFunction) {
    try {
      const { farmerId, fields, timeRange } = req.body;

      if (!farmerId) {
        res.status(400).json({ success: false, error: 'farmerId is required' });
        return;
      }

      const doc = await pdfService.generateFilteredExport(
        farmerId,
        fields || ['livestock', 'crops', 'soil', 'plans'],
        timeRange || {},
        req.user!.id,
        req.user!.role
      );

      const filename = `AgriCore_Export_${farmerId.slice(0, 8)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);
    } catch (err) {
      next(err);
    }
  }
}

export const pdfController = new PdfController();
