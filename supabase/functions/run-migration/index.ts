import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const steps: string[] = []
  const errors: string[] = []

  // Step 1: Create table
  const createTable = await supabase.rpc('run_migration_step', {
    sql_statement: `
      CREATE TABLE IF NOT EXISTS public.subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium_monthly', 'premium_annual')),
        status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
        purchase_token TEXT,
        expires_at TIMESTAMPTZ,
        trial_ends_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(user_id)
      )
    `
  })

  if (createTable.error) {
    errors.push('create_table: ' + createTable.error.message)
  } else {
    steps.push('✅ Table created')
  }

  return new Response(
    JSON.stringify({ steps, errors, note: 'Use Supabase Dashboard SQL Editor for best results' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
