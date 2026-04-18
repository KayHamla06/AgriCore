import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

// Public client — respects RLS policies, used with user JWT
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — bypasses RLS, used for server-side operations only
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

function decodeJwtRole(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { role?: string };
    return payload.role || null;
  } catch {
    return null;
  }
}

export async function runSupabaseStartupDiagnostics(): Promise<void> {
  const anonRole = decodeJwtRole(supabaseAnonKey || '');
  const serviceRole = decodeJwtRole(supabaseServiceKey || '');

  if (anonRole && anonRole !== 'anon') {
    logger.warn('SUPABASE_ANON_KEY role is unexpected', { role: anonRole });
  }

  if (serviceRole !== 'service_role') {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is not a service role key', {
      role: serviceRole || 'unknown',
    });
  }

  const criticalTables = [
    'users',
    'farmers',
    'support_plans',
    'deletion_requests',
    'data_change_requests',
    'login_activity',
  ];

  const results = await Promise.all(
    criticalTables.map(async table => {
      const { error } = await supabaseAdmin.from(table).select('id', { head: true, count: 'exact' });
      return { table, error };
    })
  );

  const missingTables = results
    .filter(r => r.error?.code === 'PGRST205')
    .map(r => r.table);

  if (missingTables.length > 0) {
    logger.warn('Supabase schema appears incomplete. Missing tables in schema cache', { missingTables });
  }

  const permissionErrors = results
    .filter(r => r.error && r.error.code !== 'PGRST205')
    .map(r => ({ table: r.table, code: r.error?.code, message: r.error?.message }));

  if (permissionErrors.length > 0) {
    logger.warn('Supabase startup diagnostics returned query errors', { permissionErrors });
  }

  // Ensure the storage bucket exists
  await ensureStorageBucket();
}

async function ensureStorageBucket(): Promise<void> {
  const bucketName = process.env.STORAGE_BUCKET || 'agricore-files';
  const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets();

  if (listErr) {
    logger.warn('Could not list storage buckets', { error: listErr.message });
    return;
  }

  const exists = buckets?.some(b => b.name === bucketName);
  if (exists) {
    logger.info('Storage bucket verified', { bucket: bucketName });
    return;
  }

  const { error: createErr } = await supabaseAdmin.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10 MB
  });

  if (createErr) {
    logger.error('Failed to create storage bucket', { bucket: bucketName, error: createErr.message });
  } else {
    logger.info('Storage bucket created', { bucket: bucketName });
  }
}

export { supabaseUrl, supabaseAnonKey };
