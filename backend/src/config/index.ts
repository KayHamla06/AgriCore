import dotenv from 'dotenv';

dotenv.config();

function readEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function parsePort(value: string, fallback: number): number {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string, fallback = false): boolean {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return fallback;
  return ['1', 'true', 'yes', 'enabled', 'on'].includes(normalized);
}

function parseSmtpPorts(value: string): { primary: number; alternate: number } {
  const parts = (value || '').split(',').map(v => v.trim()).filter(Boolean);
  return {
    primary: parsePort(parts[0] || '', 465),
    alternate: parsePort(parts[1] || '', 25025),
  };
}

const smtpPorts = parseSmtpPorts(readEnv('SMTP_Ports'));

export const config = {
  port: parsePort(readEnv('PORT') || '3000', 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || '',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean),
  storageBucket: process.env.STORAGE_BUCKET || 'agricore-files',
  appUrl: process.env.APP_URL || 'http://localhost:5500',
  backendUrl: readEnv('BACKEND_URL'),
  smtp: {
    host: readEnv('SMTP_HOST', 'SMTP_Server'),
    port: parsePort(readEnv('SMTP_PORT') || String(smtpPorts.primary), 465),
    altPort: parsePort(readEnv('SMTP_ALT_PORT') || String(smtpPorts.alternate), 25025),
    secure: parseBoolean(readEnv('SMTP_SECURE', 'SMTP_Authentication'), true),
    user: readEnv('SMTP_USER', 'SMTP_Username'),
    pass: readEnv('SMTP_PASS', 'SMTP_Password'),
  },
  weather: {
    apiUrl: process.env.WEATHER_API_URL || '',
    apiKey: process.env.WEATHER_API_KEY || '',
    archiveApiUrl: process.env.WEATHER_ARCHIVE_API_URL || 'https://archive-api.open-meteo.com/v1/archive',
  },
} as const;

// Validate critical config at startup
export function validateConfig(): void {
  const required: Array<[string, string]> = [
    ['JWT_SECRET', config.jwtSecret],
    ['SUPABASE_URL', process.env.SUPABASE_URL || ''],
    ['SUPABASE_ANON_KEY', process.env.SUPABASE_ANON_KEY || ''],
    ['SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY || ''],
  ];

  const missing = required.filter(([_, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
}
