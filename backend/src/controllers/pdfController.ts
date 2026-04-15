// ============================================
// AgriCore — PDF Controller
// Handles PDF report generation requests.
// Uses Puppeteer for high-quality HTML→PDF.
// ============================================

import { Request, Response, NextFunction } from 'express';
import { puppeteerPdfService } from '../services/puppeteerPdfService';

export class PdfController {
  /**
   * GET /api/pdf/farmer/:farmerId
   * Generate and stream a farmer report PDF via Puppeteer.
   */
  async getFarmerReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { farmerId } = req.params;

      const pdfBuffer = await puppeteerPdfService.generateFarmerReport(
        farmerId,
        req.user!.id,
        req.user!.role,
      );

      const filename = `AgriCore_Farm_Report_${farmerId.slice(0, 8)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/pdf/plans/:farmerId
   * Generate and stream a support plan report PDF via Puppeteer.
   */
  async getPlanReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { farmerId } = req.params;

      const pdfBuffer = await puppeteerPdfService.generatePlanReport(
        farmerId,
        req.user!.id,
        req.user!.role,
      );

      const filename = `AgriCore_Plan_Report_${farmerId.slice(0, 8)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/pdf/compare
   * Generate a multi-farmer comparison PDF.
   */
  async getComparisonReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { farmerIds } = req.body;

      const pdfBuffer = await puppeteerPdfService.generateComparisonReport(
        farmerIds || [],
        req.user!.id,
        req.user!.role,
      );

      const filename = `AgriCore_Comparison_Report_${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/pdf/export
   * Generate a filtered data export PDF.
   */
  async getFilteredExport(req: Request, res: Response, next: NextFunction) {
    try {
      const { farmerId, fields, timeRange } = req.body;

      if (!farmerId) {
        res.status(400).json({ success: false, error: 'farmerId is required' });
        return;
      }

      const pdfBuffer = await puppeteerPdfService.generateFilteredExport(
        farmerId,
        fields || ['livestock', 'crops', 'soil', 'plans'],
        timeRange || {},
        req.user!.id,
        req.user!.role,
      );

      const filename = `AgriCore_Export_${farmerId.slice(0, 8)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }
}

export const pdfController = new PdfController();
