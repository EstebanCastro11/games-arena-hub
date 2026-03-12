import { motion } from "framer-motion";
import { Trophy, LogOut, Swords, MapPin, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBases, useAllMatchupsWithDetails, useRotations } from "@/hooks/useGameData";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function JudgeDashboard() {
  const { displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: bases = [] } = useBases();
  const { data: allMatchups = [] } = useAllMatchupsWithDetails();
  const { data: rotations = [] } = useRotations();
  const queryClient = useQueryClient();

  // Simulated: judge assigned to first base
  const assignedBase = bases[0];
  const baseMatchups = allMatchups.filter((m: any) => m.base?.name === assignedBase?.name);

  const [scoringMatchup, setScoringMatchup] = useState<string | null>(null);
  const [result, setResult] = useState<"team_a" | "team_b" | "draw" | "">("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!scoringMatchup || !result) return;
    const match = baseMatchups.find((m: any) => m.id === scoringMatchup) as any;
    if (!match) return;

    const isMacro = match.base?.base_type === 'macro';
    const winPts = isMacro ? 2000 : 1000;
    const drawPts = isMacro ? 1000 : 500;

    let teamAPoints = 0, teamBPoints = 0;
    if (result === 'team_a') teamAPoints = winPts;
    else if (result === 'team_b') teamBPoints = winPts;
    else { teamAPoints = drawPts; teamBPoints = drawPts; }

    await supabase.from("match_results").insert({ matchup_id: scoringMatchup, result, team_a_points: teamAPoints, team_b_points: teamBPoints });
    await supabase.from("matchups").update({ status: 'completed' }).eq('id', scoringMatchup);

    setSubmitted(true);
    queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
    setTimeout(() => { setSubmitted(false); setScoringMatchup(null); setResult(""); }, 2000);
  };

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Swords className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display text-xl tracking-wider">PANEL DE JUEZ</span>
              <span className="block text-[10px] text-muted-foreground">{assignedBase?.name || 'Sin asignar'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">Hub</Link>
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground mb-1">Bienvenido, Juez</p>
          <h1 className="font-display text-4xl gradient-text mb-2">{displayName || "Juez"}</h1>
          {assignedBase && (
            <div className="flex items-center gap-2 mb-8">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Asignado a: <strong className="text-foreground">{assignedBase.name}</strong> — {assignedBase.location}</span>
              {assignedBase.base_type === 'macro' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent">MACRO</span>}
            </div>
          )}
        </motion.div>

        {/* Base Schedule */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card card-shadow rounded-2xl p-6 mb-6">
          <h3 className="font-display text-lg mb-4">PROGRAMACIÓN DE TU BASE</h3>
          <div className="space-y-3">
            {baseMatchups.map((match: any) => {
              const hasResult = match.result && match.result.length > 0;
              const canScore = !hasResult && match.status !== 'pending';
              return (
                <div key={match.id} className={`rounded-xl p-4 border-2 transition-all ${
                  scoringMatchup === match.id ? 'border-primary bg-primary/5' :
                  hasResult ? 'border-success/30 bg-success/5' :
                  'border-border bg-secondary/20'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">D{match.rotation?.day} Ronda {match.rotation?.rotation_number}</span>
                    {hasResult ? (
                      <span className="text-xs text-success flex items-center gap-1"><Check className="w-3 h-3" /> Registrado</span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        match.status === 'in_progress' ? 'bg-accent/20 text-accent live-pulse' : 'bg-secondary text-muted-foreground'
                      }`}>{match.status === 'in_progress' ? 'En Vivo' : 'Pendiente'}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: match.team_a?.color, color: '#fff' }}>{match.team_a?.number}</div>
                      <span className="font-medium">{match.team_a?.name}</span>
                    </div>
                    <span className="font-display text-xl text-muted-foreground">VS</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{match.team_b?.name}</span>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: match.team_b?.color, color: '#fff' }}>{match.team_b?.number}</div>
                    </div>
                  </div>

                  {hasResult && (
                    <div className="mt-2 text-center text-sm text-success font-medium">
                      {match.result[0].result === 'team_a' ? `${match.team_a?.name} ganó` :
                       match.result[0].result === 'team_b' ? `${match.team_b?.name} ganó` : 'Empate'}
                      <span className="text-muted-foreground ml-2">({match.result[0].team_a_points}-{match.result[0].team_b_points})</span>
                    </div>
                  )}

                  {canScore && !hasResult && (
                    <div className="mt-3">
                      {scoringMatchup === match.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { key: 'team_a', label: match.team_a?.name },
                              { key: 'draw', label: 'EMPATE' },
                              { key: 'team_b', label: match.team_b?.name },
                            ].map(opt => (
                              <button key={opt.key} onClick={() => setResult(opt.key as any)}
                                className={`py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                                  result === opt.key ? 'border-success bg-success/10 text-success' : 'border-border text-muted-foreground'
                                }`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setScoringMatchup(null); setResult(""); }}
                              className="flex-1 py-2 rounded-lg bg-secondary text-sm text-muted-foreground">Cancelar</button>
                            <button onClick={handleSubmit} disabled={!result || submitted}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                                submitted ? 'bg-success text-success-foreground' : 'gradient-primary text-primary-foreground disabled:opacity-50'
                              }`}>
                              {submitted ? '✓ Guardado' : 'Confirmar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setScoringMatchup(match.id)}
                          className="w-full py-2.5 rounded-lg gradient-primary text-sm font-medium text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform">
                          Registrar Resultado
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
