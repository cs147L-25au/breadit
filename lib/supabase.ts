import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = 'https://hunanacuomwfwmbdluxb.supabase.co'
const supabaseAnonKey = 'sb_publishable_Qvn5aHCCE8C6B4RH9OBqBg_aUrM8Xrg';

export const supabase = createClient<Database>(
  supabaseUrl, supabaseAnonKey
);

