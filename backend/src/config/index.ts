import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || '',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  storageBucket: process.env.STORAGE_BUCKET || 'agricore-files',
  appUrl: process.env.APP_URL || 'http://localhost:5500',
  weather: {
    apiUrl: process.env.WEATHER_API_URL || '',
    apiKey: process.env.WEATHER_API_KEY || '',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'AgriCore <noreply@safepassid.xyz>',
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
