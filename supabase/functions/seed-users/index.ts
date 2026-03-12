import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const users = [
      { email: 'admin@thegames.com', password: 'admin123', role: 'admin', name: 'Admin THE GAMES' },
      { email: 'capitan@thegames.com', password: 'capitan123', role: 'captain', name: 'Capitán Dragones' },
    ];

    const results = [];

    for (const u of users) {
      // Check if user exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(user => user.email === u.email);

      let userId: string;

      if (existing) {
        userId = existing.id;
        results.push({ email: u.email, status: 'already exists', userId });
      } else {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { display_name: u.name },
        });

        if (error) {
          results.push({ email: u.email, status: 'error', error: error.message });
          continue;
        }

        userId = data.user.id;
        results.push({ email: u.email, status: 'created', userId });
      }

      // Assign role (upsert)
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: userId, role: u.role }, { onConflict: 'user_id,role' });

      if (roleError) {
        results.push({ email: u.email, roleStatus: 'error', error: roleError.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
