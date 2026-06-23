import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || 'https://fliuxvovyiszsufftygk.supabase.co';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WX6M3cqgJ6tyazUf4RS2KA_QaCU-nNs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
