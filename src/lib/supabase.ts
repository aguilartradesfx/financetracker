import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseConnected = !!(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConnected
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      from() {
        throw new Error(
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in project settings.'
        );
      },
      auth: {
        getSession() {
          throw new Error(
            'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in project settings.'
          );
        },
      },
      functions: {
        invoke() {
          throw new Error(
            'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in project settings.'
          );
        },
      },
    } as any);
