/* ============================================
   AgriCore — Frontend Server
   Clean URL routing, security headers,
   static file serving, and backend integration.
   ============================================ */

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

// =============================================
//  START BACKEND IN SAME PROCESS
// =============================================
const BACKEND_INTERNAL_PORT = process.env.BACKEND_PORT || 3001;

// Set PORT for backend before loading it
const originalPort = process.env.PORT;
process.env.PORT = String(BACKEND_INTERNAL_PORT);

try {
  require('./backend/dist/server');
  console.log(`Backend API started on internal port ${BACKEND_INTERNAL_PORT}`);
} catch (err) {
  console.error('Failed to start backend:', err.message);
}

// Restore PORT for frontend
if (originalPort !== undefined) {
  process.env.PORT = originalPort;
} else {
  delete process.env.PORT;
}

const BACKEND_URL = `http://localhost:${BACKEND_INTERNAL_PORT}`;

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// In production, serve from dist/ (minified files)
// In development, serve from root (source files)
const STATIC_ROOT = IS_PROD
  ? path.join(__dirname, 'dist')
  : __dirname;

// =============================================
//  SECURITY HEADERS
// =============================================

// Helmet — comprehensive HTTP security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://unpkg.com",
        "https://cdn.jsdelivr.net"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://unpkg.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: [
        "'self'",
        "https://*.supabase.co",
        "https://api.open-meteo.com",
        "https://archive-api.open-meteo.com",
        "https://nominatim.openstreetmap.org"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
}));

// Additional security headers
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});

// Compression
app.use(compression());

// =============================================
//  API PROXY — Forward /api/* to backend
// =============================================

app.use('/api', async (req, res) => {
  try {
    const targetUrl = `${BACKEND_URL}/api${req.url}`;

    // Forward headers (auth, content-type, etc.)
    const headers = {};
    if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
    if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'];

    // Collect request body for non-GET methods
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await new Promise((resolve) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
      });
      if (body.length === 0) body = undefined;
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      signal: AbortSignal.timeout(30000),
    });

    // Forward status and response headers
    res.status(response.status);
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);

    const responseBody = await response.text();
    res.send(responseBody);
  } catch (err) {
    console.error('API proxy error:', err.message);
    res.status(502).json({ success: false, error: 'Backend unavailable' });
  }
});

// =============================================
//  CLEAN URL → HTML FILE MAPPING
// =============================================
//  These paths are designed to look like deep
//  folder structures to obscure the true layout.
// =============================================

const ROUTE_MAP = {
  '/':                                  'index.html',
  '/auth/login':                        'login.html',
  '/auth/callback':                     'auth-callback.html',
  '/auth/reset-password':               'reset-password.html',
  '/create/new/account/signup':         'signup.html',
  '/platform/dashboard':                'dashboard.html',
  '/platform/admin/console':            'admin.html',
  '/legal/terms-and-services':          'terms.html',
  '/verify':                            'verify.html',
  '/pending-verification':              'pending-verification.html',
};

// =============================================
//  BLOCK DIRECT .HTML ACCESS
// =============================================
//  Prevents users/attackers from accessing
//  the raw .html files directly.
// =============================================

app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    return res.status(404).send('Not Found');
  }
  next();
});

// =============================================
//  STATIC ASSETS (css, js, assets only)
// =============================================

// Serve static files with cache headers and no directory listing
const staticOptions = {
  dotfiles: 'deny',
  index: false,
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    // No-cache for HTML files (they should go through routes)
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    }
    // Long cache for versioned assets
    if (/\.(js|css|png|jpg|svg|woff2?)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    }
  },
};

// Only expose specific directories — not the root
app.use('/css', express.static(path.join(STATIC_ROOT, 'css'), staticOptions));
app.use('/js', express.static(path.join(STATIC_ROOT, 'js'), staticOptions));
app.use('/assets', express.static(path.join(STATIC_ROOT, 'assets'), staticOptions));

// =============================================
//  CLEAN URL ROUTES
// =============================================

Object.entries(ROUTE_MAP).forEach(([route, file]) => {
  app.get(route, (_req, res) => {
    const filePath = path.join(STATIC_ROOT, file);
    if (fs.existsSync(filePath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(filePath);
    } else {
      res.status(404).send('Not Found');
    }
  });
});

// =============================================
//  404 — ALL UNMATCHED ROUTES
// =============================================

app.use((_req, res) => {
  res.status(404).send('<!DOCTYPE html><html><head><title>404</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><h1 style="color:#888;">404 — Page Not Found</h1></body></html>');
});

// =============================================
//  START
// =============================================

app.listen(PORT, () => {
  console.log(`AgriCore frontend running on http://localhost:${PORT}`);
  console.log('Clean URL routes:');
  Object.entries(ROUTE_MAP).forEach(([route]) => {
    console.log(`  → http://localhost:${PORT}${route}`);
  });
});
