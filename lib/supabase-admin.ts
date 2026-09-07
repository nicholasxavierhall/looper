import { createClient } from '@supabase/supabase-js'

// Server-only client using the service role key, which bypasses RLS.
// Never import this file from a client component.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
