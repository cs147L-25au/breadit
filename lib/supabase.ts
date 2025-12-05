import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hunanacuomwfwmbdluxb.supabase.co'
const supabaseAnonKey = 'sb_publishable_Qvn5aHCCE8C6B4RH9OBqBg_aUrM8Xrg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
