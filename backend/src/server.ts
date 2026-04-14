// ============================================
// AgriCore — Server Entry Point
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { URL } from 'url';

// Load env — try backend/.env first, fall back to CWD
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config(); // Also try CWD for Render compatibility

import { config, validateConfig } from './config';
import { runSupabaseStartupDiagnostics } from './config/supabaseClient';
import { errorHandler, notFoundHandler, sanitizeBody, requestLogger } from './middleware';
import logger from './utils/logger';
import { startWeatherCron } from './weather/weatherCron';

// Routes
import authRoutes from './routes/authRoutes';
import farmerRoutes from './routes/farmerRoutes';
import uploadRoutes from './routes/uploadRoutes';
import planRoutes from './routes/planRoutes';
import userRoutes from './routes/userRoutes';
import weatherRoutes from './routes/weatherRoutes';
import adminRoutes from './routes/adminRoutes';
import passwordResetRoutes from './routes/passwordResetRoutes';
import taskRoutes from './routes/taskRoutes';
import todoRoutes from './routes/todoRoutes';
import noteRoutes from './routes/noteRoutes';
import fieldVisitRoutes from './routes/fieldVisitRoutes';
import chatRoutes from './routes/chatRoutes';
import notificationRoutes from './routes/notificationRoutes';
import activityLogRoutes from './routes/activityLogRoutes';
import departmentRoutes from './routes/departmentRoutes';
import pdfRoutes from './routes/pdfRoutes';
import verificationRoutes from './routes/verificationRoutes';
import dataApprovalRoutes from './routes/dataApprovalRoutes';
import ticketRoutes from './routes/ticketRoutes';
import reportRoutes from './routes/reportRoutes';

// Validate config at startup
validateConfig();

const app = express();

const externalConnectSources = [
  'https://api.open-meteo.com',
  'https://archive-api.open-meteo.com',
  'https://nominatim.openstreetmap.org',
  'https://unpkg.com',
  'https://cdn.jsdelivr.net',
];

if (process.env.SUPABASE_URL) {
  try {
    externalConnectSources.push(new URL(process.env.SUPABASE_URL).origin);
  } catch {
    logger.warn('Invalid SUPABASE_URL for CSP connect-src', { supabaseUrl: process.env.SUPABASE_URL });
  }
}

// =============================================
//  SECURITY MIDDLEWARE
// =============================================

// Helmet — HTTP security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      connectSrc: ["'self'", ...externalConnectSources],
    },
  },
}));

// CORS — restrict to allowed origins
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting — prevent brute-force attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Stricter for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts, please try again later' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Body parsing — limit JSON to 10kb to prevent payload attacks
// Upload routes handle their own larger limits via multer
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize all incoming request bodies (XSS prevention)
app.use(sanitizeBody);

// HTTP request audit logging
app.use(requestLogger);

// =============================================
//  HEALTH CHECK
// =============================================
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'AgriCore backend is running',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'AgriCore API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// =============================================
//  API ROUTES
// =============================================
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/user', userRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/visits', fieldVisitRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityLogRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/data-approval', dataApprovalRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reports', reportRoutes);

// =============================================
//  ERROR HANDLING
// =============================================
app.use(notFoundHandler);
app.use(errorHandler);

// =============================================
//  PROCESS ERROR HANDLERS (production safety)
// =============================================
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception — shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection — shutting down', { reason });
  process.exit(1);
});

// =============================================
//  START SERVER
// =============================================
const server = app.listen(config.port, () => {
  logger.info(`AgriCore API running on port ${config.port} [${config.nodeEnv}]`);

  runSupabaseStartupDiagnostics().catch(err => {
    logger.warn('Supabase startup diagnostics failed', { error: err instanceof Error ? err.message : String(err) });
  });

  // Start weather cron job
  if (config.weather.apiUrl) {
    startWeatherCron();
  } else {
    logger.warn('Weather API not configured — cron disabled');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
