import { motion } from "framer-motion";
import { Swords, LogOut, MapPin, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBases, useAllMatchupsWithDetails, useRotations } from "@/hooks/useGameData";
import { useForceReloadOnRotationChange } from "@/hooks/useRotationTimer";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function JudgeDashboard() {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: bases = [] } = useBases();
  const { data: allMatchups = [] } = useAllMatchupsWithDetails();
  const { data: rotations = [] } = useRotations();
  const queryClient = useQueryClient();

  // Find bases assigned to this judge (day 1 and day 2)
  const myBases = bases.filter((b: any) => b.judge_user_id === user?.id);
  const day1Base = myBases.find((b: any) => b.day === 1);
  const day2Base = myBases.find((b: any) => b.day === 2);

  // Fallback for demo: use first bases if not assigned
  const assignedDay1 = day1Base || bases.find((b: any) => b.day === 1);
  const assignedDay2 = day2Base || bases.find((b: any) => b.day === 2);

  const [scoringMatchup, setScoringMatchup] = useState<string | null>(null);
  const [result, setResult] = useState<"team_a" | "team_b" | "draw" | "">("");
  const [submitted, setSubmitted] = useState(false);

  // Realtime subscription for matchups and results
  useEffect(() => {
    const channel = supabase
      .channel('judge-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results' }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matchups' }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const handleSubmit = async (matchId: string) => {
    if (!result) return;
    const match = allMatchups.find((m: any) => m.id === matchId) as any;
    if (!match) return;

    const isMacro = match.base?.base_type === 'macro';
    const winPts = isMacro ? 2000 : 1000;
    const drawPts = isMacro ? 1000 : 500;

    let teamAPoints = 0, teamBPoints = 0;
    if (result === 'team_a') teamAPoints = winPts;
    else if (result === 'team_b') teamBPoints = winPts;
    else { teamAPoints = drawPts; teamBPoints = drawPts; }

    await supabase.from("match_results").insert({
      matchup_id: matchId, result, team_a_points: teamAPoints, team_b_points: teamBPoints, submitted_by: user?.id
    });
    await supabase.from("matchups").update({ status: 'completed' }).eq('id', matchId);

    setSubmitted(true);
    queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
    setTimeout(() => { setSubmitted(false); setScoringMatchup(null); setResult(""); }, 2000);
  };

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  const renderBaseSchedule = (base: any) => {
    if (!base) return <p className="text-sm text-muted-foreground p-4">No tienes base asignada para este día.</p>;

    const baseMatchups = allMatchups
      .filter((m: any) => m.base_id === base.id)
      .sort((a: any, b: any) => (a.rotation?.rotation_number || 0) - (b.rotation?.rotation_number || 0));

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{base.name}</span>
          {base.location && <span className="text-xs text-muted-foreground">— {base.location}</span>}
          {base.base_type === 'macro' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent">MACRO</span>}
        </div>

        {baseMatchups.length === 0 && <p className="text-sm text-muted-foreground">No hay enfrentamientos asignados.</p>}

        {baseMatchups.map((match: any) => {
          const resultData = Array.isArray(match.result) ? match.result[0] : match.result;
          const hasResult = !!resultData;
          const canScore = !hasResult;

          return (
            <div key={match.id} className={`rounded-xl p-4 border-2 transition-all ${
              scoringMatchup === match.id ? 'border-primary bg-primary/5' :
              hasResult ? 'border-success/30 bg-success/5' :
              'border-border bg-secondary/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-mono">Rotación {match.rotation?.rotation_number}</span>
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
                  <span className="font-medium text-sm">{match.team_a?.name}</span>
                </div>
                <span className="font-display text-xl text-muted-foreground">VS</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{match.team_b?.name}</span>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: match.team_b?.color, color: '#fff' }}>{match.team_b?.number}</div>
                </div>
              </div>

              {hasResult && (
                <div className="mt-2 text-center text-sm text-success font-medium">
                  {resultData.result === 'team_a' ? `${match.team_a?.name} ganó` :
                   resultData.result === 'team_b' ? `${match.team_b?.name} ganó` : 'Empate'}
                  <span className="text-muted-foreground ml-2">({resultData.team_a_points}-{resultData.team_b_points})</span>
                </div>
              )}

              {canScore && (
                <div className="mt-3">
                  {scoringMatchup === match.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'team_a' as const, label: match.team_a?.name },
                          { key: 'draw' as const, label: 'EMPATE' },
                          { key: 'team_b' as const, label: match.team_b?.name },
                        ].map(opt => (
                          <button key={opt.key} onClick={() => setResult(opt.key)}
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
                        <button onClick={() => handleSubmit(match.id)} disabled={!result || submitted}
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
    );
  };

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
              <span className="block text-[10px] text-muted-foreground">Resultados en tiempo real</span>
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
          <h1 className="font-display text-4xl gradient-text mb-6">{displayName || "Juez"}</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card card-shadow rounded-2xl p-6">
          <h3 className="font-display text-lg mb-4">PROGRAMACIÓN DE TUS BASES</h3>
          <Tabs defaultValue="1">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="1" className="flex-1">Día 1</TabsTrigger>
              <TabsTrigger value="2" className="flex-1">Día 2</TabsTrigger>
            </TabsList>
            <TabsContent value="1">
              {renderBaseSchedule(assignedDay1)}
            </TabsContent>
            <TabsContent value="2">
              {renderBaseSchedule(assignedDay2)}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
