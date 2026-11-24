import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// True when both settings exist. The rest of the app checks this before using Supabase,
// so a missing setting disables login instead of crashing the whole website.
export const supabaseReady = Boolean(url && key);

export const supabase = supabaseReady ? createClient(url, key) : null;