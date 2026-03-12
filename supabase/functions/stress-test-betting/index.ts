import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const results: any = {
    phase: "",
    errors: [],
    warnings: [],
    timing: {} as Record<string, number>,
    summary: {},
  };

  try {
    // ====== SETUP: Create test data ======
    results.phase = "setup";
    const startSetup = Date.now();

    // Get existing teams
    const { data: teams } = await supabase.from("teams").select("id, name, number, betting_balance").order("number");
    if (!teams || teams.length < 3) {
      return new Response(JSON.stringify({ error: "Se necesitan al menos 3 equipos en la BD para el test" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Use first 3 teams as competing teams, rest as betting teams
    const competingTeams = teams.slice(0, 3);
    const bettingTeams = teams.slice(3); // These simulate captain bets
    const NUM_SIMULATED = Math.min(bettingTeams.length, 30);

    if (NUM_SIMULATED < 5) {
      return new Response(JSON.stringify({ error: `Solo hay ${NUM_SIMULATED} equipos disponibles para apostar. Se necesitan al menos 5 (3 compiten + 5 apuestan).` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Save original balances for cleanup
    const originalBalances = bettingTeams.slice(0, NUM_SIMULATED).map(t => ({ id: t.id, balance: t.betting_balance }));

    // Create test event
    const { data: event, error: evError } = await supabase.from("betting_events").insert({
      title: `[STRESS TEST] ${NUM_SIMULATED} apuestas simultáneas`,
      status: "active",
      activated_at: new Date().toISOString(),
    }).select().single();

    if (evError || !event) {
      return new Response(JSON.stringify({ error: "Error creando evento test", detail: evError?.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Link competing teams
    await supabase.from("betting_event_teams").insert(
      competingTeams.map(t => ({ event_id: event.id, team_id: t.id }))
    );

    results.timing.setup_ms = Date.now() - startSetup;

    // ====== PHASE 1: Simulate N concurrent bets ======
    results.phase = "concurrent_bets";
    const startBets = Date.now();

    const betPromises = bettingTeams.slice(0, NUM_SIMULATED).map(async (team, idx) => {
      const betAmount = 100 + Math.floor(Math.random() * 400); // 100-500
      const predictedTeam = competingTeams[idx % competingTeams.length];
      const startSingle = Date.now();

      try {
        // Deduct balance (simulates what captain client does)
        const { error: balErr } = await supabase.from("teams").update({
          betting_balance: team.betting_balance - betAmount,
        }).eq("id", team.id);

        if (balErr) return { team: team.name, status: "balance_error", error: balErr.message, ms: Date.now() - startSingle };

        // Place bet
        const { error: betErr } = await supabase.from("captain_bets").insert({
          event_id: event.id,
          team_id: team.id,
          predicted_team_id: predictedTeam.id,
          amount: betAmount,
          placed_by: "00000000-0000-0000-0000-000000000000", // dummy user
        });

        if (betErr) return { team: team.name, status: "bet_error", error: betErr.message, ms: Date.now() - startSingle };

        return { team: team.name, status: "ok", amount: betAmount, predicted: predictedTeam.name, ms: Date.now() - startSingle };
      } catch (e: any) {
        return { team: team.name, status: "exception", error: e.message, ms: Date.now() - startSingle };
      }
    });

    const betResults = await Promise.all(betPromises);
    results.timing.concurrent_bets_ms = Date.now() - startBets;

    const successes = betResults.filter(r => r.status === "ok");
    const failures = betResults.filter(r => r.status !== "ok");

    // ====== PHASE 2: Verify data integrity ======
    results.phase = "verify";
    const startVerify = Date.now();

    const { data: betsInDb } = await supabase.from("captain_bets").select("*").eq("event_id", event.id);
    const betsCount = betsInDb?.length || 0;

    // Check for duplicate bets from same team
    const teamBetCounts: Record<string, number> = {};
    for (const bet of betsInDb || []) {
      teamBetCounts[bet.team_id] = (teamBetCounts[bet.team_id] || 0) + 1;
    }
    const duplicates = Object.entries(teamBetCounts).filter(([, count]) => count > 1);

    // Verify balance consistency
    const { data: updatedTeams } = await supabase.from("teams").select("id, betting_balance").in("id", originalBalances.map(o => o.id));
    let balanceErrors = 0;
    for (const original of originalBalances) {
      const updated = updatedTeams?.find(t => t.id === original.id);
      const bet = betsInDb?.find(b => b.team_id === original.id);
      if (updated && bet) {
        const expected = original.balance - bet.amount;
        if (updated.betting_balance !== expected) {
          balanceErrors++;
          results.warnings.push(`Balance inconsistente: ${original.id} esperado=${expected}, actual=${updated.betting_balance}`);
        }
      }
    }

    results.timing.verify_ms = Date.now() - startVerify;

    // ====== PHASE 3: Test resolution under load ======
    results.phase = "resolve";
    const startResolve = Date.now();

    const winnerId = competingTeams[0].id;
    await supabase.from("betting_events").update({
      status: "resolved",
      winner_team_id: winnerId,
      resolved_at: new Date().toISOString(),
    }).eq("id", event.id);

    // Simulate payout calculation
    const allEventBets = betsInDb || [];
    const winnerBets = allEventBets.filter(b => b.predicted_team_id === winnerId);
    const loserBets = allEventBets.filter(b => b.predicted_team_id !== winnerId);
    const lostPool = loserBets.reduce((s, b) => s + b.amount, 0);
    const totalWinnerAmount = winnerBets.reduce((s, b) => s + b.amount, 0);

    const payoutPromises = [
      ...winnerBets.map(async (bet) => {
        const share = totalWinnerAmount > 0 ? Math.floor(lostPool * (bet.amount / totalWinnerAmount)) : 0;
        const payout = bet.amount + share;
        await supabase.from("captain_bets").update({ status: "won", payout }).eq("id", bet.id);
      }),
      ...loserBets.map(async (bet) => {
        await supabase.from("captain_bets").update({ status: "lost", payout: 0 }).eq("id", bet.id);
      }),
    ];
    await Promise.all(payoutPromises);

    results.timing.resolve_ms = Date.now() - startResolve;

    // ====== CLEANUP ======
    results.phase = "cleanup";
    const startCleanup = Date.now();

    // Delete test bets
    await supabase.from("captain_bets").delete().eq("event_id", event.id);
    // Delete event teams
    await supabase.from("betting_event_teams").delete().eq("event_id", event.id);
    // Delete event
    await supabase.from("betting_events").delete().eq("id", event.id);
    // Restore balances
    for (const orig of originalBalances) {
      await supabase.from("teams").update({ betting_balance: orig.balance }).eq("id", orig.id);
    }

    results.timing.cleanup_ms = Date.now() - startCleanup;
    results.timing.total_ms = Date.now() - startSetup;

    // ====== SUMMARY ======
    results.phase = "done";
    results.summary = {
      simulated_bets: NUM_SIMULATED,
      successful_bets: successes.length,
      failed_bets: failures.length,
      bets_in_db: betsCount,
      duplicate_team_bets: duplicates.length,
      balance_errors: balanceErrors,
      avg_bet_latency_ms: Math.round(successes.reduce((s, r) => s + r.ms, 0) / (successes.length || 1)),
      max_bet_latency_ms: Math.max(...successes.map(r => r.ms), 0),
      lost_pool: lostPool,
      winner_pool: totalWinnerAmount,
      verdict: failures.length === 0 && duplicates.length === 0 && balanceErrors === 0
        ? "✅ PASSED — El sistema soporta la carga sin problemas"
        : "⚠️ ISSUES DETECTED — Revisar detalles",
    };
    results.bet_details = betResults;
    if (failures.length > 0) results.errors = failures;

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({
      phase: results.phase,
      error: err.message,
      timing: results.timing,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
