import { createClient } from '@supabase/supabase-js';
import { getConfig, CONFIG_KEYS } from '../utils/config';

const supabaseUrl = getConfig(CONFIG_KEYS.SUPABASE_URL);
const supabaseAnonKey = getConfig(CONFIG_KEYS.SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key missing. Check your .env file or Settings.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
