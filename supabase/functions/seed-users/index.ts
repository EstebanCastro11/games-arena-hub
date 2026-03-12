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

    // ========== USERS ==========
    const users = [
      { email: 'admin@thegames.com', password: 'admin123', role: 'admin', name: 'Admin THE GAMES' },
      { email: 'capitan@thegames.com', password: 'capitan123', role: 'captain', name: 'Santiago Restrepo' },
      { email: 'juez@thegames.com', password: 'juez123', role: 'judge', name: 'Juez Base 1' },
    ];

    for (const u of users) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(user => user.email === u.email);
      let userId: string;

      if (existing) {
        userId = existing.id;
      } else {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: u.email, password: u.password, email_confirm: true,
          user_metadata: { display_name: u.name },
        });
        if (error) continue;
        userId = data.user.id;
      }

      await supabaseAdmin.from('user_roles').upsert(
        { user_id: userId, role: u.role },
        { onConflict: 'user_id,role' }
      );
    }

    // ========== TEAMS ==========
    const teamNames = [
      "Dragones", "Fénix", "Titanes", "Relámpagos", "Leones",
      "Águilas", "Lobos", "Panteras", "Halcones", "Vikingos",
      "Gladiadores", "Centuriones", "Espartanos", "Valquirias", "Berserkers",
      "Samurais", "Ninjas", "Ronin", "Corsarios", "Piratas",
      "Templarios", "Cruzados", "Inmortales", "Colosos", "Minotauros",
      "Grifos", "Quimeras", "Hidras", "Kraken", "Cerbero"
    ];
    const colors = [
      "#e63946","#457b9d","#2a9d8f","#e9c46a","#f4a261",
      "#264653","#6a0572","#1b998b","#ff6b6b","#4ecdc4",
      "#45b7d1","#96ceb4","#ffeaa7","#636e72","#fd79a8",
      "#a29bfe","#00b894","#fdcb6e","#e17055","#0984e3",
      "#6c5ce7","#00cec9","#fab1a0","#74b9ff","#55efc4",
      "#ff7675","#a8e6cf","#ffd3b6","#d63031","#b2bec3"
    ];
    const faculties = ["Ingeniería","Administración","Ciencias","Derecho","Humanidades","Economía","Comunicación","Diseño","Música","Arquitectura"];

    // Check if teams exist
    const { data: existingTeams } = await supabaseAdmin.from('teams').select('id').limit(1);
    if (!existingTeams || existingTeams.length === 0) {
      const teamsToInsert = teamNames.map((name, i) => ({
        number: i + 1,
        name,
        color: colors[i],
        faculty: faculties[i % faculties.length],
        members_count: Math.floor(Math.random() * 5) + 5,
        betting_balance: 5000,
      }));
      await supabaseAdmin.from('teams').insert(teamsToInsert);
    }

    // ========== BASES ==========
    const { data: existingBases } = await supabaseAdmin.from('bases').select('id').limit(1);
    if (!existingBases || existingBases.length === 0) {
      const basesToInsert: any[] = [];
      for (let day = 1; day <= 2; day++) {
        for (let i = 1; i <= 15; i++) {
          const isMacro = i === 5 || i === 10;
          basesToInsert.push({
            name: `Base ${(day - 1) * 15 + i}`,
            day,
            description: `${isMacro ? 'Macro base' : 'Base'} ${i} del Día ${day}`,
            location: `Zona ${String.fromCharCode(65 + ((i - 1) % 6))}`,
            base_type: isMacro ? 'macro' : 'normal',
            order_index: i,
            active: day === 1,
          });
        }
      }
      await supabaseAdmin.from('bases').insert(basesToInsert);
    }

    // ========== ROTATIONS & MATCHUPS ==========
    const { data: existingRotations } = await supabaseAdmin.from('rotations').select('id').limit(1);
    if (!existingRotations || existingRotations.length === 0) {
      const { data: allTeams } = await supabaseAdmin.from('teams').select('id, number').order('number');
      const { data: allBases } = await supabaseAdmin.from('bases').select('id, day, order_index').order('order_index');

      if (allTeams && allBases) {
        const day1Bases = allBases.filter(b => b.day === 1);

        // Generate 3 rotations for Day 1
        for (let rot = 1; rot <= 3; rot++) {
          const { data: rotation } = await supabaseAdmin.from('rotations').insert({
            day: 1,
            rotation_number: rot,
            status: rot <= 2 ? 'completed' : 'in_progress',
          }).select().single();

          if (rotation) {
            const matchups: any[] = [];
            // Circular rotation algorithm
            const teams = [...allTeams];
            // For rotation > 1, rotate teams (keeping team 1 fixed)
            if (rot > 1) {
              const fixed = teams[0];
              const rest = teams.slice(1);
              for (let s = 0; s < rot - 1; s++) {
                rest.push(rest.shift()!);
              }
              teams.splice(0, teams.length, fixed, ...rest);
            }

            for (let i = 0; i < 15; i++) {
              matchups.push({
                rotation_id: rotation.id,
                base_id: day1Bases[i].id,
                team_a_id: teams[i].id,
                team_b_id: teams[29 - i].id,
                status: rot <= 2 ? 'completed' : 'in_progress',
              });
            }
            await supabaseAdmin.from('matchups').insert(matchups);

            // Add results for completed rotations
            if (rot <= 2) {
              const { data: rotMatchups } = await supabaseAdmin.from('matchups')
                .select('id, base_id')
                .eq('rotation_id', rotation.id);

              if (rotMatchups) {
                const { data: basesInfo } = await supabaseAdmin.from('bases')
                  .select('id, base_type')
                  .in('id', rotMatchups.map(m => m.base_id));

                const baseTypeMap = new Map(basesInfo?.map(b => [b.id, b.base_type]) || []);

                for (const m of rotMatchups) {
                  const results = ['team_a', 'team_b', 'draw'];
                  const result = results[Math.floor(Math.random() * 3)];
                  const isMacro = baseTypeMap.get(m.base_id) === 'macro';
                  const winPts = isMacro ? 2000 : 1000;
                  const drawPts = isMacro ? 1000 : 500;

                  let teamAPoints = 0, teamBPoints = 0;
                  if (result === 'team_a') { teamAPoints = winPts; }
                  else if (result === 'team_b') { teamBPoints = winPts; }
                  else { teamAPoints = drawPts; teamBPoints = drawPts; }

                  await supabaseAdmin.from('match_results').insert({
                    matchup_id: m.id,
                    result,
                    team_a_points: teamAPoints,
                    team_b_points: teamBPoints,
                  });
                }
              }
            }
          }
        }

        // Update team stats from results
        const { data: allMatchups } = await supabaseAdmin.from('matchups')
          .select('id, team_a_id, team_b_id, status');
        const { data: allResults } = await supabaseAdmin.from('match_results')
          .select('matchup_id, result, team_a_points, team_b_points');

        if (allMatchups && allResults) {
          const teamStats = new Map<string, { points: number; wins: number; losses: number; draws: number; played: number }>();

          for (const r of allResults) {
            const matchup = allMatchups.find(m => m.id === r.matchup_id);
            if (!matchup) continue;

            for (const tid of [matchup.team_a_id, matchup.team_b_id]) {
              if (!teamStats.has(tid)) teamStats.set(tid, { points: 0, wins: 0, losses: 0, draws: 0, played: 0 });
            }

            const statsA = teamStats.get(matchup.team_a_id)!;
            const statsB = teamStats.get(matchup.team_b_id)!;
            statsA.played++; statsB.played++;
            statsA.points += r.team_a_points; statsB.points += r.team_b_points;

            if (r.result === 'team_a') { statsA.wins++; statsB.losses++; }
            else if (r.result === 'team_b') { statsB.wins++; statsA.losses++; }
            else { statsA.draws++; statsB.draws++; }
          }

          for (const [teamId, stats] of teamStats) {
            await supabaseAdmin.from('teams').update({
              total_points: stats.points,
              wins: stats.wins,
              losses: stats.losses,
              draws: stats.draws,
              matches_played: stats.played,
            }).eq('id', teamId);
          }
        }
      }
    }

    // ========== ANNOUNCEMENTS ==========
    const { data: existingAnn } = await supabaseAdmin.from('announcements').select('id').limit(1);
    if (!existingAnn || existingAnn.length === 0) {
      await supabaseAdmin.from('announcements').insert([
        { message: "🔥 RONDA 3 EN 5 MINUTOS. EQUIPOS, A SUS BASES.", type: "urgent" },
        { message: "📢 Los resultados de la Ronda 2 han sido publicados.", type: "info" },
        { message: "⚡ Las apuestas para la Ronda 3 cierran pronto.", type: "warning" },
        { message: "🏆 ¡Dragones lidera la clasificación!", type: "info" },
      ]);
    }

    return new Response(JSON.stringify({ success: true, message: 'Demo data seeded' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
