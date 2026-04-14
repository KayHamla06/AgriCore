// ============================================
// AgriCore — Puppeteer PDF Controller
// Handles requests for Puppeteer-rendered PDF
// reports. Isolated — does not touch existing
// pdfController or pdfService.
// ============================================

import { Request, Response, NextFunction } from 'express';
import { puppeteerPdfService } from '../services/puppeteerPdfService';
import type { PuppeteerPdfOptions } from '../services/puppeteerPdfService';

export class PuppeteerPdfController {
  /**
   * GET /api/reports/farmer/:farmerId
   * Generate and download a branded Puppeteer-rendered farmer report PDF.
   *
   * Query params:
   *   ?map=false      — exclude map section
   *   ?analytics=false — exclude analytics cards
   *   ?format=Letter   — use US Letter instead of A4
   */
  async getFarmerReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { farmerId } = req.params;

      const options: PuppeteerPdfOptions = {
        includeMap: req.query.map !== 'false',
        includeAnalytics: req.query.analytics !== 'false',
        format: req.query.format === 'Letter' ? 'Letter' : 'A4',
      };

      const pdfBuffer = await puppeteerPdfService.generateFarmerReport(
        farmerId,
        req.user!.id,
        req.user!.role,
        options,
      );

      const filename = `AgriCore_Report_${farmerId.slice(0, 8)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }
}

export const puppeteerPdfController = new PuppeteerPdfController();
