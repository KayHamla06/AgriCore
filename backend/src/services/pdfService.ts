// ============================================
// AgriCore — PDF Service
// Generates branded PDF reports for farmers.
// Access control: farmers see own data only,
// government can access any farmer's data.
// ============================================

import PDFDocument from 'pdfkit';
import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import path from 'path';
import fs from 'fs';

export class PdfService {
  private logoPath: string;

  constructor() {
    // Logo path — resolve relative to project root
    this.logoPath = path.resolve(__dirname, '..', '..', '..', 'assets', 'AgriCore Logo.png');
  }

  /**
   * Generate a farmer report PDF.
   * Returns a PDFDocument stream.
   */
  async generateFarmerReport(
    farmerId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<PDFKit.PDFDocument> {
    // 1. Get farmer record
    const { data: farmer, error: farmerError } = await supabaseAdmin
      .from('farmers')
      .select('*')
      .eq('id', farmerId)
      .single();

    if (farmerError || !farmer) {
      throw new AppError('Farmer not found', 404);
    }

    // 2. Access control: farmer can only export own data
    if (requestingUserRole === 'farmer') {
      if (farmer.user_id !== requestingUserId) {
        throw new AppError('You can only download your own farm report.', 403);
      }
    }

    // 3. Get farmer's user record for address info
    const { data: farmerUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', farmer.user_id)
      .maybeSingle();

    // 4. Get related data
    const [livestockRes, cropsRes, soilRes] = await Promise.all([
      supabaseAdmin.from('livestock').select('*').eq('farmer_id', farmerId),
      supabaseAdmin.from('crops').select('*').eq('farmer_id', farmerId),
      supabaseAdmin.from('soil_data').select('*').eq('farmer_id', farmerId).order('tested_at', { ascending: false }).limit(1),
    ]);

    const livestock = livestockRes.data || [];
    const crops = cropsRes.data || [];
    const soilData = soilRes.data?.[0] || null;

    // 5. Build PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      info: {
        Title: `AgriCore Farm Report — ${farmer.name}`,
        Author: 'AgriCore Platform',
        Subject: 'Farm Performance Report',
      },
    });

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // --- Header with logo ---
    this.drawHeader(doc, pageWidth);

    // --- Report title ---
    doc.moveDown(1);
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a2e')
      .text('Farm Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#666')
      .text(`Generated on ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    doc.moveDown(1);

    // --- Divider ---
    this.drawDivider(doc, pageWidth);

    // --- Farmer Information ---
    doc.moveDown(0.5);
    this.drawSectionTitle(doc, 'Farmer Information');

    const farmerInfo: [string, string][] = [
      ['Name', farmer.name],
      ['Email', farmer.email || 'N/A'],
      ['Phone', farmer.phone || 'N/A'],
      ['Province', farmer.province || 'N/A'],
      ['District', farmer.district || 'N/A'],
      ['Farm Size', farmer.farm_size_hectares ? `${farmer.farm_size_hectares} hectares` : 'N/A'],
      ['Verified', farmer.verified ? 'Yes' : 'No'],
    ];

    this.drawInfoTable(doc, farmerInfo, pageWidth);

    // --- Address ---
    if (farmerUser) {
      doc.moveDown(0.5);
      this.drawSectionTitle(doc, 'Home Address');

      const addressParts: string[] = [];
      if (farmerUser.address_number) addressParts.push(farmerUser.address_number);
      if (farmerUser.street_name) addressParts.push(farmerUser.street_name);
      if (farmerUser.suburb) addressParts.push(farmerUser.suburb);
      if (farmerUser.town) addressParts.push(farmerUser.town);
      if (farmerUser.province) addressParts.push(farmerUser.province);
      if (farmerUser.postal_code) addressParts.push(farmerUser.postal_code);

      if (addressParts.length > 0) {
        doc.fontSize(10).font('Helvetica').fillColor('#333')
          .text(addressParts.join(', '));
      } else {
        doc.fontSize(10).font('Helvetica').fillColor('#999')
          .text('No address on file');
      }
    }

    // --- Farm Address ---
    doc.moveDown(0.5);
    this.drawSectionTitle(doc, 'Farm Location');
    const farmAddr: [string, string][] = [
      ['Address', farmer.address_line || 'N/A'],
      ['Town', farmer.town || 'N/A'],
      ['Postal Code', farmer.postal_code || 'N/A'],
    ];
    if (farmer.latitude && farmer.longitude) {
      farmAddr.push(['GPS Coordinates', `${farmer.latitude}, ${farmer.longitude}`]);
    }
    this.drawInfoTable(doc, farmAddr, pageWidth);

    // --- Livestock ---
    if (livestock.length > 0) {
      this.checkPageBreak(doc, 150);
      doc.moveDown(1);
      this.drawDivider(doc, pageWidth);
      doc.moveDown(0.5);
      this.drawSectionTitle(doc, 'Livestock');

      const totalAnimals = livestock.reduce((sum: number, l: any) => sum + (l.total || 0), 0);
      doc.fontSize(10).font('Helvetica').fillColor('#333')
        .text(`Total Animals: ${totalAnimals}`);
      doc.moveDown(0.3);

      // Table header
      const colWidths = [pageWidth * 0.25, pageWidth * 0.15, pageWidth * 0.12, pageWidth * 0.12, pageWidth * 0.12, pageWidth * 0.24];
      const headers = ['Animal Type', 'Total', 'Born', 'Sold', 'Young', 'Diseases'];
      this.drawTableRow(doc, headers, colWidths, true);

      livestock.forEach((l: any) => {
        this.checkPageBreak(doc, 20);
        const diseases = Array.isArray(l.diseases) && l.diseases.length > 0
          ? l.diseases.join(', ')
          : 'None';
        this.drawTableRow(doc, [
          l.animal_type || 'Unknown',
          String(l.total || 0),
          String(l.born || 0),
          String(l.sold || 0),
          String(l.young || 0),
          diseases,
        ], colWidths, false);
      });
    }

    // --- Crops ---
    if (crops.length > 0) {
      this.checkPageBreak(doc, 150);
      doc.moveDown(1);
      this.drawDivider(doc, pageWidth);
      doc.moveDown(0.5);
      this.drawSectionTitle(doc, 'Crop Performance');

      const cropColWidths = [pageWidth * 0.25, pageWidth * 0.2, pageWidth * 0.15, pageWidth * 0.2, pageWidth * 0.2];
      const cropHeaders = ['Crop', 'Hectares', 'Yield (t)', 'Season', 'Status'];
      this.drawTableRow(doc, cropHeaders, cropColWidths, true);

      crops.forEach((c: any) => {
        this.checkPageBreak(doc, 20);
        this.drawTableRow(doc, [
          c.crop_type || 'Unknown',
          String(c.hectares_planted || 0),
          String(c.yield_tonnes || 0),
          c.season || 'N/A',
          c.status || 'N/A',
        ], cropColWidths, false);
      });
    }

    // --- Soil Data ---
    if (soilData) {
      this.checkPageBreak(doc, 120);
      doc.moveDown(1);
      this.drawDivider(doc, pageWidth);
      doc.moveDown(0.5);
      this.drawSectionTitle(doc, 'Latest Soil Analysis');

      const soilInfo: [string, string][] = [
        ['pH Level', soilData.ph !== null ? String(soilData.ph) : 'N/A'],
        ['Nitrogen (mg/kg)', soilData.nitrogen !== null ? String(soilData.nitrogen) : 'N/A'],
        ['Phosphorus (mg/kg)', soilData.phosphorus !== null ? String(soilData.phosphorus) : 'N/A'],
        ['Potassium (mg/kg)', soilData.potassium !== null ? String(soilData.potassium) : 'N/A'],
        ['Organic Matter (%)', soilData.organic_matter !== null ? String(soilData.organic_matter) : 'N/A'],
        ['Tested', soilData.tested_at ? new Date(soilData.tested_at).toLocaleDateString('en-ZA') : 'N/A'],
      ];
      this.drawInfoTable(doc, soilInfo, pageWidth);
    }

    // --- Footer ---
    doc.moveDown(2);
    this.drawDivider(doc, pageWidth);
    doc.moveDown(0.5);

    // Verification status badge
    const verStatus = farmerUser?.verification_status || 'unverified';
    const badgeColor = verStatus === 'verified' ? '#2563eb' : '#f59e0b';
    const badgeLabel = verStatus === 'verified' ? '✓ Verified Farmer' : '⚠ Unverified Farmer';
    doc.fontSize(9).font('Helvetica-Bold').fillColor(badgeColor)
      .text(badgeLabel, { align: 'center' });
    doc.moveDown(0.2);

    // Generated by + timestamp
    const { data: generatedByUser } = await supabaseAdmin
      .from('users')
      .select('name, role')
      .eq('id', requestingUserId)
      .maybeSingle();

    const generatedBy = generatedByUser ? `${generatedByUser.name} (${generatedByUser.role})` : requestingUserId;
    doc.fontSize(8).font('Helvetica').fillColor('#999')
      .text(`Generated by: ${generatedBy}`, { align: 'center' });
    doc.text(`Timestamp: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown(0.2);
    doc.text('This report was generated by AgriCore — Agricultural Intelligence Platform.', { align: 'center' });
    doc.text('Confidential. Do not distribute without authorization.', { align: 'center' });

    doc.end();
    return doc;
  }

  /**
   * Generate a support plan report PDF for a farmer.
   */
  async generatePlanReport(
    farmerId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<PDFKit.PDFDocument> {
    // Access control
    const { data: farmer, error: farmerErr } = await supabaseAdmin
      .from('farmers')
      .select('*')
      .eq('id', farmerId)
      .single();

    if (farmerErr || !farmer) throw new AppError('Farmer not found', 404);

    if (requestingUserRole === 'farmer' && farmer.user_id !== requestingUserId) {
      throw new AppError('You can only download your own plan report.', 403);
    }

    // Get plans
    const { data: plans } = await supabaseAdmin
      .from('support_plans')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      info: {
        Title: `AgriCore Plan Report — ${farmer.name}`,
        Author: 'AgriCore Platform',
        Subject: 'Support Plan Report',
      },
    });

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    this.drawHeader(doc, pageWidth);

    doc.moveDown(1);
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a2e')
      .text('Support Plan Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#666')
      .text(`Farmer: ${farmer.name} | Generated: ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    doc.moveDown(1);
    this.drawDivider(doc, pageWidth);

    if (!plans || plans.length === 0) {
      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica').fillColor('#666')
        .text('No support plans found for this farmer.', { align: 'center' });
    } else {
      for (const plan of plans) {
        this.checkPageBreak(doc, 180);
        doc.moveDown(0.8);
        this.drawSectionTitle(doc, plan.type || 'Support Plan');

        const planInfo: [string, string][] = [
          ['Status', plan.status || 'N/A'],
          ['Approval', plan.approval_status || 'N/A'],
          ['Objectives', plan.objectives || 'N/A'],
          ['Budget', plan.budget ? `R ${Number(plan.budget).toLocaleString()}` : 'N/A'],
          ['Timeline', plan.timeline || 'N/A'],
          ['Created By', plan.created_by_role || 'N/A'],
          ['Created', plan.created_at ? new Date(plan.created_at).toLocaleDateString('en-ZA') : 'N/A'],
        ];
        this.drawInfoTable(doc, planInfo, pageWidth);
        doc.moveDown(0.3);
        this.drawDivider(doc, pageWidth);
      }
    }

    // Footer with verification & generated-by
    await this.drawEnhancedFooter(doc, pageWidth, farmer.user_id, requestingUserId);

    doc.end();
    return doc;
  }

  /**
   * Generate a multi-farmer comparison PDF.
   */
  async generateComparisonReport(
    farmerIds: string[],
    dataTypes: string[],
    timeRange: { from?: string; to?: string },
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<PDFKit.PDFDocument> {
    // Only gov/admin/supervisor can compare
    if (requestingUserRole === 'farmer') {
      throw new AppError('Farmers cannot generate comparison reports.', 403);
    }

    if (!farmerIds || farmerIds.length < 2) {
      throw new AppError('At least 2 farmers required for comparison.', 400);
    }

    // Get farmers
    const { data: farmers, error: farmersErr } = await supabaseAdmin
      .from('farmers')
      .select('*')
      .in('id', farmerIds);

    if (farmersErr || !farmers || farmers.length === 0) {
      throw new AppError('No farmers found', 404);
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      info: {
        Title: 'AgriCore Multi-Farmer Comparison Report',
        Author: 'AgriCore Platform',
        Subject: 'Farmer Comparison Report',
      },
    });

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    this.drawHeader(doc, pageWidth);

    doc.moveDown(1);
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a2e')
      .text('Farmer Comparison Report', { align: 'center' });
    doc.moveDown(0.3);

    const dateStr = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
    let rangeStr = '';
    if (timeRange.from || timeRange.to) {
      rangeStr = ` | Period: ${timeRange.from || 'Start'} — ${timeRange.to || 'Now'}`;
    }
    doc.fontSize(10).font('Helvetica').fillColor('#666')
      .text(`${farmers.length} Farmers Compared | ${dateStr}${rangeStr}`, { align: 'center' });
    doc.moveDown(1);
    this.drawDivider(doc, pageWidth);

    // For each farmer, fetch the requested data types and display
    for (const farmer of farmers) {
      this.checkPageBreak(doc, 200);
      doc.moveDown(0.8);
      this.drawSectionTitle(doc, farmer.name);

      const baseInfo: [string, string][] = [
        ['Province', farmer.province || 'N/A'],
        ['District', farmer.district || 'N/A'],
        ['Farm Size', farmer.farm_size_hectares ? `${farmer.farm_size_hectares} ha` : 'N/A'],
      ];
      this.drawInfoTable(doc, baseInfo, pageWidth);

      if (dataTypes.includes('livestock')) {
        let query = supabaseAdmin.from('livestock').select('*').eq('farmer_id', farmer.id).eq('data_status', 'approved');
        if (timeRange.from) query = query.gte('recorded_at', timeRange.from);
        if (timeRange.to) query = query.lte('recorded_at', timeRange.to);
        const { data: livestock } = await query;

        if (livestock && livestock.length > 0) {
          doc.moveDown(0.3);
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#16a34a').text('Livestock');
          const totalAnimals = livestock.reduce((sum: number, l: any) => sum + (l.total || 0), 0);
          doc.fontSize(9).font('Helvetica').fillColor('#333')
            .text(`Types: ${livestock.length} | Total Animals: ${totalAnimals}`);
        }
      }

      if (dataTypes.includes('crops')) {
        let query = supabaseAdmin.from('crops').select('*').eq('farmer_id', farmer.id).eq('data_status', 'approved');
        if (timeRange.from) query = query.gte('recorded_at', timeRange.from);
        if (timeRange.to) query = query.lte('recorded_at', timeRange.to);
        const { data: crops } = await query;

        if (crops && crops.length > 0) {
          doc.moveDown(0.3);
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#16a34a').text('Crops');
          const totalYield = crops.reduce((sum: number, c: any) => sum + (c.yield_tonnes || 0), 0);
          const totalHa = crops.reduce((sum: number, c: any) => sum + (c.hectares_planted || 0), 0);
          doc.fontSize(9).font('Helvetica').fillColor('#333')
            .text(`Crops: ${crops.length} | Total Hectares: ${totalHa} | Total Yield: ${totalYield}t`);
        }
      }

      if (dataTypes.includes('soil')) {
        const { data: soil } = await supabaseAdmin.from('soil_data').select('*').eq('farmer_id', farmer.id).eq('data_status', 'approved').order('tested_at', { ascending: false }).limit(1);

        if (soil && soil.length > 0) {
          const s = soil[0];
          doc.moveDown(0.3);
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#16a34a').text('Soil Analysis');
          doc.fontSize(9).font('Helvetica').fillColor('#333')
            .text(`pH: ${s.ph ?? 'N/A'} | N: ${s.nitrogen ?? 'N/A'} | P: ${s.phosphorus ?? 'N/A'} | K: ${s.potassium ?? 'N/A'}`);
        }
      }

      doc.moveDown(0.5);
      this.drawDivider(doc, pageWidth);
    }

    // Footer
    await this.drawEnhancedFooter(doc, pageWidth, null, requestingUserId);

    doc.end();
    return doc;
  }

  /**
   * Generate a filtered data export PDF for a single farmer.
   */
  async generateFilteredExport(
    farmerId: string,
    fields: string[],
    timeRange: { from?: string; to?: string },
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<PDFKit.PDFDocument> {
    const { data: farmer, error: farmerErr } = await supabaseAdmin
      .from('farmers')
      .select('*')
      .eq('id', farmerId)
      .single();

    if (farmerErr || !farmer) throw new AppError('Farmer not found', 404);

    if (requestingUserRole === 'farmer' && farmer.user_id !== requestingUserId) {
      throw new AppError('You can only export your own data.', 403);
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      info: {
        Title: `AgriCore Filtered Export — ${farmer.name}`,
        Author: 'AgriCore Platform',
        Subject: 'Filtered Data Export',
      },
    });

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    this.drawHeader(doc, pageWidth);

    doc.moveDown(1);
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a2e')
      .text('Filtered Data Export', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#666')
      .text(`Farmer: ${farmer.name} | Generated: ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    if (timeRange.from || timeRange.to) {
      doc.fontSize(10).font('Helvetica').fillColor('#666')
        .text(`Period: ${timeRange.from || 'Start'} — ${timeRange.to || 'Now'}`, { align: 'center' });
    }
    doc.moveDown(1);
    this.drawDivider(doc, pageWidth);

    // Export based on selected fields
    if (fields.includes('livestock')) {
      let query = supabaseAdmin.from('livestock').select('*').eq('farmer_id', farmerId).eq('data_status', 'approved');
      if (timeRange.from) query = query.gte('recorded_at', timeRange.from);
      if (timeRange.to) query = query.lte('recorded_at', timeRange.to);
      const { data: livestock } = await query;

      if (livestock && livestock.length > 0) {
        this.checkPageBreak(doc, 150);
        doc.moveDown(0.8);
        this.drawSectionTitle(doc, 'Livestock Records');

        const colWidths = [pageWidth * 0.25, pageWidth * 0.15, pageWidth * 0.12, pageWidth * 0.12, pageWidth * 0.12, pageWidth * 0.24];
        this.drawTableRow(doc, ['Type', 'Total', 'Born', 'Sold', 'Young', 'Diseases'], colWidths, true);
        livestock.forEach((l: any) => {
          this.checkPageBreak(doc, 20);
          const diseases = Array.isArray(l.diseases) && l.diseases.length > 0 ? l.diseases.join(', ') : 'None';
          this.drawTableRow(doc, [
            l.animal_type || 'Unknown', String(l.total || 0), String(l.born || 0),
            String(l.sold || 0), String(l.young || 0), diseases,
          ], colWidths, false);
        });
      }
    }

    if (fields.includes('crops')) {
      let query = supabaseAdmin.from('crops').select('*').eq('farmer_id', farmerId).eq('data_status', 'approved');
      if (timeRange.from) query = query.gte('recorded_at', timeRange.from);
      if (timeRange.to) query = query.lte('recorded_at', timeRange.to);
      const { data: crops } = await query;

      if (crops && crops.length > 0) {
        this.checkPageBreak(doc, 150);
        doc.moveDown(0.8);
        this.drawSectionTitle(doc, 'Crop Records');

        const colWidths = [pageWidth * 0.25, pageWidth * 0.2, pageWidth * 0.15, pageWidth * 0.2, pageWidth * 0.2];
        this.drawTableRow(doc, ['Crop', 'Hectares', 'Yield (t)', 'Season', 'Status'], colWidths, true);
        crops.forEach((c: any) => {
          this.checkPageBreak(doc, 20);
          this.drawTableRow(doc, [
            c.crop_type || 'Unknown', String(c.hectares_planted || 0), String(c.yield_tonnes || 0),
            c.season || 'N/A', c.status || 'N/A',
          ], colWidths, false);
        });
      }
    }

    if (fields.includes('soil')) {
      const { data: soil } = await supabaseAdmin.from('soil_data').select('*').eq('farmer_id', farmerId).eq('data_status', 'approved').order('tested_at', { ascending: false });

      if (soil && soil.length > 0) {
        this.checkPageBreak(doc, 120);
        doc.moveDown(0.8);
        this.drawSectionTitle(doc, 'Soil Data');

        soil.forEach((s: any) => {
          const soilInfo: [string, string][] = [
            ['pH', s.ph !== null ? String(s.ph) : 'N/A'],
            ['Nitrogen', s.nitrogen !== null ? String(s.nitrogen) : 'N/A'],
            ['Phosphorus', s.phosphorus !== null ? String(s.phosphorus) : 'N/A'],
            ['Potassium', s.potassium !== null ? String(s.potassium) : 'N/A'],
            ['Organic Matter', s.organic_matter !== null ? String(s.organic_matter) : 'N/A'],
            ['Tested', s.tested_at ? new Date(s.tested_at).toLocaleDateString('en-ZA') : 'N/A'],
          ];
          this.drawInfoTable(doc, soilInfo, pageWidth);
          doc.moveDown(0.3);
        });
      }
    }

    if (fields.includes('plans')) {
      const { data: plans } = await supabaseAdmin.from('support_plans').select('*').eq('farmer_id', farmerId);

      if (plans && plans.length > 0) {
        this.checkPageBreak(doc, 120);
        doc.moveDown(0.8);
        this.drawSectionTitle(doc, 'Support Plans');

        plans.forEach((p: any) => {
          this.checkPageBreak(doc, 80);
          const planInfo: [string, string][] = [
            ['Type', p.type || 'N/A'],
            ['Status', p.status || 'N/A'],
            ['Budget', p.budget ? `R ${Number(p.budget).toLocaleString()}` : 'N/A'],
            ['Timeline', p.timeline || 'N/A'],
          ];
          this.drawInfoTable(doc, planInfo, pageWidth);
          doc.moveDown(0.3);
        });
      }
    }

    // Footer
    await this.drawEnhancedFooter(doc, pageWidth, farmer.user_id, requestingUserId);

    doc.end();
    return doc;
  }

  // ==========================================
  //  ENHANCED FOOTER WITH VERIFICATION & USER
  // ==========================================

  private async drawEnhancedFooter(
    doc: PDFKit.PDFDocument,
    pageWidth: number,
    farmerUserId: string | null,
    requestingUserId: string
  ): Promise<void> {
    doc.moveDown(2);
    this.drawDivider(doc, pageWidth);
    doc.moveDown(0.5);

    // Farmer verification status if applicable
    if (farmerUserId) {
      const { data: farmerUser } = await supabaseAdmin
        .from('users')
        .select('verification_status')
        .eq('id', farmerUserId)
        .maybeSingle();

      const verStatus = farmerUser?.verification_status || 'unverified';
      const badgeColor = verStatus === 'verified' ? '#2563eb' : '#f59e0b';
      const badgeLabel = verStatus === 'verified' ? '✓ Verified Farmer' : '⚠ Unverified Farmer';
      doc.fontSize(9).font('Helvetica-Bold').fillColor(badgeColor)
        .text(badgeLabel, { align: 'center' });
      doc.moveDown(0.2);
    }

    // Generated by
    const { data: genUser } = await supabaseAdmin
      .from('users')
      .select('name, role')
      .eq('id', requestingUserId)
      .maybeSingle();

    const generatedBy = genUser ? `${genUser.name} (${genUser.role})` : requestingUserId;
    doc.fontSize(8).font('Helvetica').fillColor('#999')
      .text(`Generated by: ${generatedBy}`, { align: 'center' });
    doc.text(`Timestamp: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown(0.2);
    doc.text('This report was generated by AgriCore — Agricultural Intelligence Platform.', { align: 'center' });
    doc.text('Confidential. Do not distribute without authorization.', { align: 'center' });
  }

  // ==========================================
  //  PDF HELPER METHODS
  // ==========================================

  private drawHeader(doc: PDFKit.PDFDocument, _pageWidth: number): void {
    // Try to add logo
    if (fs.existsSync(this.logoPath)) {
      doc.image(this.logoPath, doc.page.width - doc.page.margins.right - 80, doc.page.margins.top - 10, {
        width: 80,
      });
    }

    doc.fontSize(24).font('Helvetica-Bold').fillColor('#16a34a')
      .text('AgriCore', doc.page.margins.left, doc.page.margins.top);
    doc.fontSize(9).font('Helvetica').fillColor('#888')
      .text('Agricultural Intelligence Platform');
  }

  private drawSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a2e')
      .text(title);
    doc.moveDown(0.3);
  }

  private drawDivider(doc: PDFKit.PDFDocument, pageWidth: number): void {
    const y = doc.y;
    doc.strokeColor('#e0e0e0').lineWidth(1)
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.margins.left + pageWidth, y)
      .stroke();
  }

  private drawInfoTable(doc: PDFKit.PDFDocument, rows: [string, string][], _pageWidth: number): void {
    const labelWidth = 150;
    rows.forEach(([label, value]) => {
      const y = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#555')
        .text(label + ':', doc.page.margins.left, y, { width: labelWidth, continued: false });
      doc.fontSize(10).font('Helvetica').fillColor('#333')
        .text(value, doc.page.margins.left + labelWidth, y);
      doc.moveDown(0.1);
    });
  }

  private drawTableRow(
    doc: PDFKit.PDFDocument,
    cells: string[],
    colWidths: number[],
    isHeader: boolean
  ): void {
    const y = doc.y;
    let x = doc.page.margins.left;

    if (isHeader) {
      doc.rect(x, y - 2, colWidths.reduce((a, b) => a + b, 0), 18)
        .fill('#f1f5f9');
    }

    cells.forEach((cell, i) => {
      doc.fontSize(9)
        .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(isHeader ? '#374151' : '#555')
        .text(cell, x + 4, y + 2, { width: colWidths[i] - 8, lineBreak: false });
      x += colWidths[i];
    });

    doc.y = y + 18;
  }

  private checkPageBreak(doc: PDFKit.PDFDocument, requiredSpace: number): void {
    if (doc.y + requiredSpace > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  }
}

export const pdfService = new PdfService();
