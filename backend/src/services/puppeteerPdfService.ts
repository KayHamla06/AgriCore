// ============================================
// AgriCore — Puppeteer PDF Service
// Generates branded HTML-to-PDF reports with
// logo, analytics tables, and map section.
// Isolated module — does not replace pdfService.
// ============================================

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { supabaseAdmin } from '../config/supabaseClient';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

export interface PuppeteerPdfOptions {
  /** Include map section with GPS coordinates (default: true) */
  includeMap?: boolean;
  /** Include analytics summary (default: true) */
  includeAnalytics?: boolean;
  /** Paper format (default: 'A4') */
  format?: 'A4' | 'Letter';
}

// ---------------------------------------------------------------------------
//  Service
// ---------------------------------------------------------------------------

export class PuppeteerPdfService {
  private logoBase64: string | null = null;

  /** Lazily load and cache the logo as a data-URI */
  private getLogoDataUri(): string {
    if (this.logoBase64) return this.logoBase64;

    const logoPath = path.resolve(__dirname, '..', '..', '..', 'assets', 'AgriCore Logo.png');
    if (fs.existsSync(logoPath)) {
      const buf = fs.readFileSync(logoPath);
      this.logoBase64 = `data:image/png;base64,${buf.toString('base64')}`;
    } else {
      this.logoBase64 = '';
      logger.warn('Logo file not found at ' + logoPath);
    }
    return this.logoBase64;
  }

  // -----------------------------------------------------------------------
  //  Public — Generate farmer report PDF buffer
  // -----------------------------------------------------------------------

  async generateFarmerReport(
    farmerId: string,
    requestingUserId: string,
    requestingUserRole: string,
    options: PuppeteerPdfOptions = {},
  ): Promise<Buffer> {
    const { includeMap = true, includeAnalytics = true, format = 'A4' } = options;

    // 1. Fetch farmer
    const { data: farmer, error: farmerErr } = await supabaseAdmin
      .from('farmers')
      .select('*')
      .eq('id', farmerId)
      .maybeSingle();

    if (farmerErr || !farmer) throw new AppError('Farmer not found', 404);

    // 2. Access control
    if (requestingUserRole === 'farmer' && farmer.user_id !== requestingUserId) {
      throw new AppError('You can only download your own farm report.', 403);
    }

    // 3. Parallel data fetches
    const [livestockRes, cropsRes, soilRes, userRes] = await Promise.all([
      supabaseAdmin.from('livestock').select('*').eq('farmer_id', farmerId),
      supabaseAdmin.from('crops').select('*').eq('farmer_id', farmerId),
      supabaseAdmin
        .from('soil_data')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('tested_at', { ascending: false })
        .limit(1),
      supabaseAdmin.from('users').select('*').eq('id', farmer.user_id).maybeSingle(),
    ]);

    const livestock = livestockRes.data || [];
    const crops = cropsRes.data || [];
    const soilData = soilRes.data?.[0] || null;
    const farmerUser = userRes.data;

    // 4. Build HTML
    const html = this.buildReportHtml({
      farmer,
      farmerUser,
      livestock,
      crops,
      soilData,
      includeMap,
      includeAnalytics,
      generatedBy: requestingUserId,
    });

    // 5. Render PDF with Puppeteer
    return this.renderPdf(html, format);
  }

  // -----------------------------------------------------------------------
  //  Internal — Render HTML → PDF via Puppeteer
  // -----------------------------------------------------------------------

  private async renderPdf(html: string, format: 'A4' | 'Letter'): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format,
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      if (browser) await browser.close();
    }
  }

  // -----------------------------------------------------------------------
  //  Internal — Build branded HTML report
  // -----------------------------------------------------------------------

  private buildReportHtml(data: {
    farmer: Record<string, any>;
    farmerUser: Record<string, any> | null;
    livestock: Record<string, any>[];
    crops: Record<string, any>[];
    soilData: Record<string, any> | null;
    includeMap: boolean;
    includeAnalytics: boolean;
    generatedBy: string;
  }): string {
    const { farmer, farmerUser, livestock, crops, soilData, includeMap, includeAnalytics, generatedBy } = data;
    const logoUri = this.getLogoDataUri();
    const now = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

    // Escape helper to prevent XSS in generated HTML
    const esc = (val: unknown): string => {
      const str = String(val ?? '');
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    // --- Livestock table rows ---
    const livestockRows = livestock
      .map(
        (l) => `
        <tr>
          <td>${esc(l.animal_type)}</td>
          <td>${esc(l.total ?? 0)}</td>
          <td>${esc(l.born ?? 0)}</td>
          <td>${esc(l.sold ?? 0)}</td>
          <td>${esc(l.young ?? 0)}</td>
          <td>${esc(Array.isArray(l.diseases) && l.diseases.length ? l.diseases.join(', ') : 'None')}</td>
        </tr>`,
      )
      .join('');

    // --- Crops table rows ---
    const cropRows = crops
      .map(
        (c) => `
        <tr>
          <td>${esc(c.crop_type)}</td>
          <td>${esc(c.hectares_planted ?? 0)}</td>
          <td>${esc(c.yield_tonnes ?? 0)}</td>
          <td>${esc(c.season)}</td>
          <td>${esc(c.status)}</td>
        </tr>`,
      )
      .join('');

    // --- Analytics summary ---
    const totalAnimals = livestock.reduce((s, l) => s + (l.total || 0), 0);
    const totalHectares = crops.reduce((s, c) => s + (c.hectares_planted || 0), 0);
    const totalYield = crops.reduce((s, c) => s + (c.yield_tonnes || 0), 0);

    // --- Address ---
    const addressParts: string[] = [];
    if (farmerUser) {
      for (const key of ['address_number', 'street_name', 'suburb', 'town', 'province', 'postal_code']) {
        if (farmerUser[key]) addressParts.push(String(farmerUser[key]));
      }
    }

    // --- Verification ---
    const verStatus = farmerUser?.verification_status || 'unverified';
    const verBadge =
      verStatus === 'verified'
        ? '<span class="badge verified">&#10003; Verified Farmer</span>'
        : '<span class="badge unverified">&#9888; Unverified Farmer</span>';

    // --- Map section ---
    const mapSection =
      includeMap && farmer.latitude && farmer.longitude
        ? `
        <div class="section">
          <h2>Farm Location</h2>
          <div class="map-placeholder">
            <p>GPS: ${esc(farmer.latitude)}, ${esc(farmer.longitude)}</p>
            <p class="muted">Map rendering requires an online tile service.<br/>
            Coordinates above can be used with Google Maps or OpenStreetMap.</p>
          </div>
        </div>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>AgriCore Farm Report — ${esc(farmer.name)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; font-size: 12px; line-height: 1.5; }
  .page { padding: 0; }

  /* Header */
  .header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #2d6a4f; padding-bottom: 12px; margin-bottom: 18px; }
  .header img { height: 60px; }
  .header .title-block h1 { font-size: 22px; color: #2d6a4f; margin-bottom: 2px; }
  .header .title-block p { font-size: 10px; color: #666; }

  /* Sections */
  .section { margin-bottom: 18px; }
  .section h2 { font-size: 14px; color: #2d6a4f; border-bottom: 1px solid #d0d0d0; padding-bottom: 4px; margin-bottom: 8px; }

  /* Info grid */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; }
  .info-grid .label { font-weight: 600; color: #555; }
  .info-grid .value { color: #1a1a2e; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { background: #2d6a4f; color: #fff; text-align: left; padding: 6px 8px; font-size: 11px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; font-size: 11px; }
  tr:nth-child(even) { background: #f7faf8; }

  /* Analytics cards */
  .analytics { display: flex; gap: 12px; margin-bottom: 12px; }
  .card { flex: 1; background: #f0f7f4; border-left: 4px solid #2d6a4f; padding: 10px 14px; border-radius: 4px; }
  .card .num { font-size: 22px; font-weight: 700; color: #2d6a4f; }
  .card .lbl { font-size: 10px; color: #666; }

  /* Map placeholder */
  .map-placeholder { border: 2px dashed #b0c4b1; border-radius: 8px; padding: 24px; text-align: center; color: #555; background: #f7faf8; }
  .map-placeholder .muted { font-size: 10px; color: #999; margin-top: 6px; }

  /* Badge */
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; }
  .badge.verified { background: #dbeafe; color: #1e40af; }
  .badge.unverified { background: #fef3c7; color: #92400e; }

  /* Footer */
  .footer { margin-top: 24px; border-top: 2px solid #2d6a4f; padding-top: 10px; text-align: center; font-size: 9px; color: #999; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    ${logoUri ? `<img src="${logoUri}" alt="AgriCore Logo"/>` : ''}
    <div class="title-block">
      <h1>Farm Report</h1>
      <p>Generated on ${esc(now)}</p>
    </div>
  </div>

  <!-- Farmer Info -->
  <div class="section">
    <h2>Farmer Information</h2>
    <div class="info-grid">
      <span class="label">Name</span><span class="value">${esc(farmer.name)}</span>
      <span class="label">Email</span><span class="value">${esc(farmer.email || 'N/A')}</span>
      <span class="label">Phone</span><span class="value">${esc(farmer.phone || 'N/A')}</span>
      <span class="label">Province</span><span class="value">${esc(farmer.province || 'N/A')}</span>
      <span class="label">District</span><span class="value">${esc(farmer.district || 'N/A')}</span>
      <span class="label">Farm Size</span><span class="value">${farmer.farm_size_hectares ? esc(farmer.farm_size_hectares) + ' hectares' : 'N/A'}</span>
      <span class="label">Status</span><span class="value">${verBadge}</span>
    </div>
  </div>

  <!-- Address -->
  ${
    addressParts.length
      ? `<div class="section"><h2>Home Address</h2><p>${esc(addressParts.join(', '))}</p></div>`
      : ''
  }

  <!-- Farm Location -->
  <div class="section">
    <h2>Farm Address</h2>
    <div class="info-grid">
      <span class="label">Address</span><span class="value">${esc(farmer.address_line || 'N/A')}</span>
      <span class="label">Town</span><span class="value">${esc(farmer.town || 'N/A')}</span>
      <span class="label">Postal Code</span><span class="value">${esc(farmer.postal_code || 'N/A')}</span>
      ${farmer.latitude && farmer.longitude ? `<span class="label">GPS</span><span class="value">${esc(farmer.latitude)}, ${esc(farmer.longitude)}</span>` : ''}
    </div>
  </div>

  ${mapSection}

  <!-- Analytics Summary -->
  ${
    includeAnalytics
      ? `
  <div class="section">
    <h2>Analytics Overview</h2>
    <div class="analytics">
      <div class="card"><div class="num">${totalAnimals}</div><div class="lbl">Total Livestock</div></div>
      <div class="card"><div class="num">${totalHectares}</div><div class="lbl">Hectares Planted</div></div>
      <div class="card"><div class="num">${totalYield}</div><div class="lbl">Yield (tonnes)</div></div>
      <div class="card"><div class="num">${crops.length}</div><div class="lbl">Crop Types</div></div>
    </div>
  </div>`
      : ''
  }

  <!-- Livestock -->
  ${
    livestock.length
      ? `
  <div class="section">
    <h2>Livestock (${totalAnimals} total)</h2>
    <table>
      <thead><tr><th>Animal Type</th><th>Total</th><th>Born</th><th>Sold</th><th>Young</th><th>Diseases</th></tr></thead>
      <tbody>${livestockRows}</tbody>
    </table>
  </div>`
      : ''
  }

  <!-- Crops -->
  ${
    crops.length
      ? `
  <div class="section">
    <h2>Crop Performance</h2>
    <table>
      <thead><tr><th>Crop</th><th>Hectares</th><th>Yield (t)</th><th>Season</th><th>Status</th></tr></thead>
      <tbody>${cropRows}</tbody>
    </table>
  </div>`
      : ''
  }

  <!-- Soil -->
  ${
    soilData
      ? `
  <div class="section">
    <h2>Latest Soil Analysis</h2>
    <div class="info-grid">
      <span class="label">pH Level</span><span class="value">${soilData.ph ?? 'N/A'}</span>
      <span class="label">Nitrogen (mg/kg)</span><span class="value">${soilData.nitrogen ?? 'N/A'}</span>
      <span class="label">Phosphorus (mg/kg)</span><span class="value">${soilData.phosphorus ?? 'N/A'}</span>
      <span class="label">Potassium (mg/kg)</span><span class="value">${soilData.potassium ?? 'N/A'}</span>
      <span class="label">Organic Matter (%)</span><span class="value">${soilData.organic_matter ?? 'N/A'}</span>
      <span class="label">Tested</span><span class="value">${soilData.tested_at ? new Date(soilData.tested_at).toLocaleDateString('en-ZA') : 'N/A'}</span>
    </div>
  </div>`
      : ''
  }

  <!-- Footer -->
  <div class="footer">
    ${verBadge}
    <p>Generated by: ${esc(generatedBy)} | ${new Date().toISOString()}</p>
    <p>This report was generated by AgriCore — Agricultural Intelligence Platform.</p>
    <p>Confidential. Do not distribute without authorization.</p>
  </div>

</div>
</body>
</html>`;
  }
}

export const puppeteerPdfService = new PuppeteerPdfService();
