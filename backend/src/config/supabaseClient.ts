import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

export { supabaseUrl, supabaseAnonKey };
