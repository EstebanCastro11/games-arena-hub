import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Trophy, AlertCircle } from "lucide-react";
import { useTeams, useBases, useRotations, useMatchups } from "@/hooks/useGameData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";

export default function AdminScoring() {
  const [day, setDay] = useState<1 | 2>(1);
  const [rotationId, setRotationId] = useState("");
  const [matchupId, setMatchupId] = useState("");
  const [result, setResult] = useState<"team_a" | "team_b" | "draw" | "">("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const { data: rotations = [] } = useRotations(day);
  const { data: matchups = [] } = useMatchups(rotationId || undefined);

  const selectedMatchup = matchups.find((m: any) => m.id === matchupId);
  const isMacro = (selectedMatchup as any)?.base?.base_type === 'macro';

  const getPoints = () => {
    if (!result) return { a: 0, b: 0 };
    const win = isMacro ? 2000 : 1000;
    const drawPts = isMacro ? 1000 : 500;
    if (result === 'team_a') return { a: win, b: 0 };
    if (result === 'team_b') return { a: 0, b: win };
    return { a: drawPts, b: drawPts };
  };

  const points = getPoints();

  const handleSubmit = async () => {
    if (!matchupId || !result) return;

    const { error } = await supabase.from("match_results").insert({
      matchup_id: matchupId,
      result,
      team_a_points: points.a,
      team_b_points: points.b,
      notes: notes || null,
    });

    if (!error) {
      // Update matchup status
      await supabase.from("matchups").update({ status: 'completed' }).eq('id', matchupId);

      // Update team points
      const m = selectedMatchup as any;
      if (m) {
        const updates = [
          { id: m.team_a?.id, pts: points.a, w: result === 'team_a' ? 1 : 0, d: result === 'draw' ? 1 : 0, l: result === 'team_b' ? 1 : 0 },
          { id: m.team_b?.id, pts: points.b, w: result === 'team_b' ? 1 : 0, d: result === 'draw' ? 1 : 0, l: result === 'team_a' ? 1 : 0 },
        ];
        for (const u of updates) {
          if (!u.id) continue;
          const { data: team } = await supabase.from("teams").select("total_points, wins, draws, losses, matches_played").eq("id", u.id).single();
          if (team) {
            await supabase.from("teams").update({
              total_points: team.total_points + u.pts,
              wins: team.wins + u.w,
              draws: team.draws + u.d,
              losses: team.losses + u.l,
              matches_played: team.matches_played + 1,
            }).eq("id", u.id);
          }
        }
      }

      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["matchups"] });
      queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      setTimeout(() => {
        setSubmitted(false);
        setMatchupId("");
        setResult("");
        setNotes("");
      }, 2000);
    }
  };

  // Filter matchups without results
  const pendingMatchups = matchups.filter((m: any) => !m.result || m.result.length === 0);

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl mb-1">REGISTRAR PUNTAJE</h1>
        <p className="text-sm text-muted-foreground mb-6">Ingresa el resultado de un enfrentamiento</p>

        <div className="bg-card card-shadow rounded-2xl p-6 space-y-5">
          <div>
            <label className="text-sm font-medium mb-2 block">Día</label>
            <div className="flex gap-2">
              {[1, 2].map(d => (
                <button key={d} onClick={() => { setDay(d as 1|2); setRotationId(""); setMatchupId(""); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${day === d ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  Día {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Rotación</label>
            <select value={rotationId} onChange={e => { setRotationId(e.target.value); setMatchupId(""); }}
              className="w-full bg-background rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card">
              <option value="">Seleccionar rotación...</option>
              {rotations.map((r: any) => (
                <option key={r.id} value={r.id}>Ronda {r.rotation_number} — {r.status === 'completed' ? 'Completada' : r.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}</option>
              ))}
            </select>
          </div>

          {rotationId && (
            <div>
              <label className="text-sm font-medium mb-2 block">Enfrentamiento ({pendingMatchups.length} pendientes)</label>
              <select value={matchupId} onChange={e => setMatchupId(e.target.value)}
                className="w-full bg-background rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card">
                <option value="">Seleccionar enfrentamiento...</option>
                {pendingMatchups.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.base?.name} {m.base?.base_type === 'macro' ? '(MACRO)' : ''}: #{m.team_a?.number} {m.team_a?.name} vs #{m.team_b?.number} {m.team_b?.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedMatchup && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
              <label className="text-sm font-medium mb-2 block">Resultado</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'team_a', label: (selectedMatchup as any).team_a?.name, sub: 'Gana' },
                  { key: 'draw', label: 'EMPATE', sub: 'Draw' },
                  { key: 'team_b', label: (selectedMatchup as any).team_b?.name, sub: 'Gana' },
                ].map(opt => (
                  <button key={opt.key} onClick={() => setResult(opt.key as any)}
                    className={`py-4 rounded-xl text-sm font-medium transition-all border-2 ${
                      result === opt.key ? 'border-success bg-success/10 text-success' : 'border-border text-muted-foreground hover:border-foreground/20'
                    }`}>
                    <div className="font-display text-lg">{opt.label}</div>
                    <div className="text-xs mt-1">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {result && selectedMatchup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-secondary/50 rounded-xl p-4">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Vista previa {isMacro && '(MACRO BASE)'}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{(selectedMatchup as any).team_a?.name}</span>
                <span className="font-display text-2xl tabular-nums gradient-text">+{points.a.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium">{(selectedMatchup as any).team_b?.name}</span>
                <span className="font-display text-2xl tabular-nums gradient-text">+{points.b.toLocaleString()}</span>
              </div>
            </motion.div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Notas (opcional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..."
              rows={2} className="w-full bg-background rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card resize-none" />
          </div>

          <button onClick={handleSubmit} disabled={!matchupId || !result || submitted}
            className={`w-full py-3.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              submitted ? 'bg-success text-success-foreground' : 'gradient-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
            }`}>
            {submitted ? <><Check className="w-4 h-4" /> ¡Puntaje Registrado!</> : <><Trophy className="w-4 h-4" /> Guardar Resultado</>}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
