import { useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, LogOut, TrendingUp, DollarSign, CalendarClock, MapPin, Timer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLeaderboard, useAllMatchupsWithDetails, useRotations } from "@/hooks/useGameData";
import { useRotationTimer, useCurrentRotation, formatTime } from "@/hooks/useRotationTimer";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function CaptainDashboard() {
  const { displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: leaderboard = [] } = useLeaderboard();
  const { data: allMatchups = [] } = useAllMatchupsWithDetails();
  const { data: rotations = [] } = useRotations();
  const timer = useRotationTimer();
  const currentRotation = useCurrentRotation();
  const queryClient = useQueryClient();

  // Realtime subscription for matchups
  useEffect(() => {
    const channel = supabase
      .channel("captain-matchups")
      .on("postgres_changes", { event: "*", schema: "public", table: "matchups" }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "match_results" }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Simulate team assignment (first team for demo)
  const myTeam = leaderboard[5] || leaderboard[0];
  const myRank = myTeam ? leaderboard.findIndex(t => t.id === myTeam.id) + 1 : 0;

  // Find matchups for this team
  const myMatchups = allMatchups.filter((m: any) =>
    m.team_a?.id === myTeam?.id || m.team_b?.id === myTeam?.id
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (!myTeam) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display text-xl tracking-wider">MI EQUIPO</span>
              <span className="block text-[10px] text-muted-foreground">Panel de Capitán</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">Hub</Link>
            <Link to="/leaderboard" className="text-xs text-muted-foreground hover:text-foreground">Clasificación</Link>
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Rotation Timer Banner */}
        {(timer.isActive || currentRotation) && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card card-shadow rounded-2xl p-6 mb-6 glow-primary border-2 border-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-destructive live-pulse" />
                  <span className="text-xs text-muted-foreground font-medium">EN VIVO</span>
                </div>
                {currentRotation && (
                  <h2 className="font-display text-2xl gradient-text">
                    DÍA {currentRotation.day} — ROTACIÓN {currentRotation.rotation_number}
                  </h2>
                )}
              </div>
              {timer.isActive && (
                <div className="text-center">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                    <Timer className="w-3 h-3" /> TIEMPO
                  </div>
                  <div className={`font-display text-4xl md:text-5xl tabular-nums ${
                    timer.remainingSeconds <= 60 ? 'text-destructive animate-pulse' : 'gradient-text'
                  }`}>
                    {formatTime(timer.remainingSeconds)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground mb-1">Bienvenido, Capitán</p>
          <h1 className="font-display text-4xl gradient-text mb-8">{displayName || "Capitán"}</h1>
        </motion.div>

        {/* Team Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card card-shadow rounded-2xl p-6 mb-6 glow-primary">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold border-2"
              style={{ backgroundColor: myTeam.color, borderColor: `${myTeam.color}80`, color: '#fff' }}>{myTeam.number}</div>
            <div>
              <h2 className="font-display text-3xl">{myTeam.name}</h2>
              <p className="text-sm text-muted-foreground">{myTeam.faculty || 'Sin facultad'} • {myTeam.members_count} miembros</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Puntos", value: myTeam.total_points.toLocaleString() },
              { label: "Victorias", value: myTeam.wins },
              { label: "Empates", value: myTeam.draws },
              { label: "Derrotas", value: myTeam.losses },
            ].map(s => (
              <div key={s.label} className="bg-secondary/30 rounded-xl p-3 text-center">
                <div className="font-display text-xl tabular-nums">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Rank */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card card-shadow rounded-xl p-5 mb-6">
          <h3 className="font-display text-lg mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> TU POSICIÓN</h3>
          <div className="flex items-center gap-4">
            <span className="font-display text-5xl gradient-text">#{myRank}</span>
            <div className="flex-1">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full gradient-primary rounded-full"
                  style={{ width: `${(myTeam.total_points / Math.max(leaderboard[0]?.total_points || 1, 1)) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {myTeam.total_points.toLocaleString()} / {(leaderboard[0]?.total_points || 0).toLocaleString()} pts del líder
              </p>
            </div>
          </div>
        </motion.div>

        {/* Team Journey - All rotations by day */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card card-shadow rounded-xl p-5 mb-6">
          <h3 className="font-display text-lg mb-4 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" /> TU RECORRIDO
          </h3>
          <Tabs defaultValue="1">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="1" className="flex-1">Día 1</TabsTrigger>
              <TabsTrigger value="2" className="flex-1">Día 2</TabsTrigger>
            </TabsList>
            {[1, 2].map(day => {
              const dayRotations = rotations
                .filter(r => r.day === day)
                .sort((a, b) => a.rotation_number - b.rotation_number);

              return (
                <TabsContent key={day} value={String(day)} className="space-y-3">
                  {dayRotations.length === 0 && (
                    <p className="text-sm text-muted-foreground">No hay rotaciones para el Día {day}.</p>
                  )}
                  {dayRotations.map(rotation => {
                    const match = myMatchups.find((m: any) => m.rotation_id === rotation.id);
                    if (!match) {
                      return (
                        <div key={rotation.id} className="bg-secondary/30 rounded-lg p-3 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full shrink-0 bg-muted-foreground" />
                          <div className="flex-1">
                            <span className="text-sm font-medium">Rotación {rotation.rotation_number}</span>
                            <p className="text-[10px] text-muted-foreground">Sin asignación</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">—</span>
                        </div>
                      );
                    }

                    const isTeamA = match.team_a?.id === myTeam.id;
                    const opponent = isTeamA ? match.team_b : match.team_a;
                    const resultData = Array.isArray(match.result) ? match.result[0] : match.result;
                    const hasResult = !!resultData;
                    const myPoints = hasResult ? (isTeamA ? resultData.team_a_points : resultData.team_b_points) : null;

                    return (
                      <div key={match.id} className="bg-secondary/30 rounded-lg p-3 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          match.status === 'completed' ? 'bg-success' : match.status === 'in_progress' ? 'bg-accent live-pulse' : 'bg-muted-foreground'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground text-[10px] font-mono">R{rotation.rotation_number}</span>
                            <span className="font-medium">vs</span>
                            <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                              style={{ backgroundColor: opponent?.color, color: '#fff' }}>{opponent?.number}</div>
                            <span className="font-medium truncate">{opponent?.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {match.base?.name} {match.base?.location ? `— ${match.base.location}` : ''}
                          </div>
                        </div>
                        {hasResult ? (
                          <div className="text-right shrink-0">
                            <span className="font-display text-lg tabular-nums gradient-text">+{myPoints?.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                            match.status === 'in_progress' ? 'bg-accent/20 text-accent' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {match.status === 'in_progress' ? 'En Vivo' : 'Pendiente'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </TabsContent>
              );
            })}
          </Tabs>
        </motion.div>

        {/* Betting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card card-shadow rounded-xl p-5">
          <h3 className="font-display text-lg mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-accent" /> BALANCE DE APUESTAS</h3>
          <div className="flex items-center justify-between">
            <span className="font-display text-4xl tabular-nums gradient-text">{myTeam.betting_balance.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">créditos disponibles</span>
          </div>
          <Link to="/apuestas" className="mt-4 block text-center gradient-primary py-2.5 rounded-lg text-sm font-medium text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform">
            Ir a Apuestas
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
