import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 CONNECT YOUR DATABASE HERE
//
// 1. Go to https://supabase.com → New project
// 2. Settings → API → copy your Project URL and anon key
// 3. Create a .env file in the project root with:
//
//    VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
//    VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
//
// 4. The app will use real data automatically — no other changes needed.
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Graceful fallback — app still works in demo mode without credentials
const url  = SUPABASE_URL  || 'https://placeholder.supabase.co';
const anon = SUPABASE_ANON || 'placeholder-key';

export const supabase = createClient(url, anon);

export const isSupabaseConfigured =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
