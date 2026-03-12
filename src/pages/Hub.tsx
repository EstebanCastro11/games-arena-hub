import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Trophy, Swords, TrendingUp, Zap, ChevronRight, Megaphone, DollarSign, Users, MapPin, Timer } from "lucide-react";
import { useLeaderboard, useAnnouncements, useAllMatchupsWithDetails, useDashboardStats } from "@/hooks/useGameData";
import { useRotationTimer, useCurrentRotation, useForceReloadOnRotationChange, formatTime } from "@/hooks/useRotationTimer";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Hub() {
  const { data: leaderboard = [] } = useLeaderboard();
  const { data: announcements = [] } = useAnnouncements();
  const { data: allMatchups = [] } = useAllMatchupsWithDetails();
  const { data: stats } = useDashboardStats();
  const timer = useRotationTimer();
  const currentRotation = useCurrentRotation();
  const queryClient = useQueryClient();
  useForceReloadOnRotationChange();

  // Realtime for matchups
  useEffect(() => {
    const channel = supabase
      .channel("hub-matchups")
      .on("postgres_changes", { event: "*", schema: "public", table: "matchups" }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "match_results" }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const top3 = leaderboard.slice(0, 3);

  // Current rotation matchups (all 15)
  const currentMatchups = currentRotation
    ? allMatchups.filter((m: any) => m.rotation_id === currentRotation.id)
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl tracking-wider">THE GAMES</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">Clasificación</Link>
            <Link to="/apuestas" className="text-muted-foreground hover:text-foreground transition-colors">Apuestas</Link>
            <Link to="/login" className="gradient-primary px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground hover:scale-105 active:scale-95 transition-transform">
              Entrar
            </Link>
          </nav>
          <Link to="/login" className="md:hidden gradient-primary px-3 py-1.5 rounded-lg text-xs font-medium text-primary-foreground">
            Entrar
          </Link>
        </div>
      </header>

      {/* Announcement Banner */}
      {announcements.length > 0 && (
        <div className="gradient-primary py-2">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-hidden">
            <Megaphone className="w-4 h-4 text-primary-foreground shrink-0" />
            <div className="overflow-hidden whitespace-nowrap">
              <motion.div
                animate={{ x: ["100%", "-100%"] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="text-sm font-medium text-primary-foreground inline-block"
              >
                {announcements.map((a: any) => a.message).join("   •   ")}
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
          <motion.div variants={item} className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card card-shadow text-xs text-muted-foreground mb-6">
              <div className="w-2 h-2 rounded-full bg-success live-pulse" />
              {currentRotation ? `DÍA ${currentRotation.day} — ROTACIÓN ${currentRotation.rotation_number}` : 'PRÓXIMAMENTE'}
            </div>
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-none gradient-text mb-4">THE GAMES</h1>
            <p className="font-display text-2xl md:text-3xl text-muted-foreground tracking-wider mb-2">DÍAS EAFIT 2026</p>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">30 equipos. 30 bases. 2 días de batalla. ¿Quién se llevará la gloria?</p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/leaderboard" className="gradient-primary px-6 py-3 rounded-lg font-medium text-primary-foreground hover:scale-105 active:scale-95 transition-transform flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Ver Clasificación
              </Link>
              <Link to="/apuestas" className="bg-card card-shadow px-6 py-3 rounded-lg font-medium text-foreground hover:card-shadow-hover transition-shadow flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Apuestas
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* LIVE MATCHUPS — Full 15 bases */}
      {currentRotation && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {/* Rotation Header */}
            <motion.div variants={item} className="bg-card card-shadow rounded-2xl p-6 md:p-8 mb-6 glow-primary">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-destructive live-pulse" />
                  <div>
                    <h2 className="font-display text-3xl md:text-5xl gradient-text">ROTACIÓN {currentRotation.rotation_number}</h2>
                    <p className="text-sm text-muted-foreground">Día {currentRotation.day} — {currentMatchups.length} bases activas</p>
                  </div>
                </div>
                {timer.isActive && (
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Timer className="w-3 h-3" /> TIEMPO RESTANTE
                    </div>
                    <div className={`font-display text-5xl md:text-6xl tabular-nums ${
                      timer.remainingSeconds <= 60 ? 'text-destructive' : 'gradient-text'
                    }`}>
                      {formatTime(timer.remainingSeconds)}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* All 15 matchups grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentMatchups
                .sort((a: any, b: any) => (a.base?.order_index || 0) - (b.base?.order_index || 0))
                .map((match: any) => {
                  const resultData = Array.isArray(match.result) ? match.result[0] : match.result;
                  const hasResult = !!resultData;

                  return (
                    <motion.div key={match.id} variants={item}
                      className={`bg-card card-shadow rounded-xl p-5 transition-shadow ${
                        hasResult ? 'border border-success/30' : 'hover:card-shadow-hover'
                      }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 text-primary" />
                          <span className="font-medium">{match.base?.name}</span>
                          {match.base?.location && <span>— {match.base.location}</span>}
                        </div>
                        {match.base?.base_type === 'macro' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">MACRO ★</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ backgroundColor: match.team_a?.color, color: '#fff' }}>{match.team_a?.number}</div>
                          <div className="min-w-0">
                            <span className="font-medium text-sm block truncate">{match.team_a?.name}</span>
                          </div>
                        </div>
                        <span className="font-display text-xl text-muted-foreground shrink-0 mx-1">VS</span>
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <div className="min-w-0 text-right">
                            <span className="font-medium text-sm block truncate">{match.team_b?.name}</span>
                          </div>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ backgroundColor: match.team_b?.color, color: '#fff' }}>{match.team_b?.number}</div>
                        </div>
                      </div>

                      {hasResult && (
                        <div className="mt-3 pt-3 border-t border-border text-center">
                          <span className="text-sm text-success font-medium">
                            {resultData.result === 'team_a' ? `🏆 ${match.team_a?.name}` :
                             resultData.result === 'team_b' ? `🏆 ${match.team_b?.name}` : '🤝 Empate'}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({resultData.team_a_points} - {resultData.team_b_points})
                          </span>
                        </div>
                      )}

                      {!hasResult && match.status === 'in_progress' && (
                        <div className="mt-3 pt-3 border-t border-border text-center">
                          <span className="text-xs text-accent flex items-center justify-center gap-1">
                            <Zap className="w-3 h-3" /> En juego...
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
            </div>

            {currentMatchups.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Swords className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No hay enfrentamientos en esta rotación aún.</p>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {/* Podium */}
      {top3.length >= 3 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.h2 variants={item} className="font-display text-3xl md:text-4xl text-center mb-8 gradient-text">🏆 TOP 3</motion.h2>
            <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-2xl mx-auto items-end">
              {[top3[1], top3[0], top3[2]].map((team, idx) => {
                const podiumOrder = [2, 1, 3];
                const heights = ["h-32 md:h-40", "h-40 md:h-52", "h-24 md:h-32"];
                return (
                  <motion.div key={team.id} variants={item} className="text-center">
                    <div className={`${heights[idx]} rounded-t-xl flex flex-col items-center justify-end pb-4 relative overflow-hidden`}
                      style={{ background: `linear-gradient(to top, ${team.color}40, ${team.color}15)` }}>
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-lg md:text-xl font-bold mb-2 border-2"
                        style={{ backgroundColor: team.color, borderColor: `${team.color}80`, color: '#fff' }}>
                        {team.number}
                      </div>
                      <span className="font-display text-lg md:text-2xl">{team.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{team.total_points.toLocaleString()} pts</span>
                    </div>
                    <div className="bg-card card-shadow rounded-b-xl py-2">
                      <span className="font-display text-2xl md:text-3xl gradient-text">#{podiumOrder[idx]}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>
      )}

      {/* Quick Stats */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Equipos", value: stats?.totalTeams || 30 },
            { icon: Swords, label: "Bases", value: stats?.totalBases || 30 },
            { icon: Trophy, label: "Partidos Jugados", value: stats?.completedMatchups || 0 },
            { icon: DollarSign, label: "Apuestas", value: stats?.totalBets || 0 },
          ].map((stat) => (
            <motion.div key={stat.label} variants={item} className="bg-card card-shadow rounded-xl p-5 text-center">
              <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="font-display text-3xl tabular-nums">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Leaderboard Preview */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <motion.div variants={item} className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl md:text-3xl">CLASIFICACIÓN</h2>
            <Link to="/leaderboard" className="text-sm text-primary flex items-center gap-1 hover:underline">
              Ver todo <ChevronRight className="w-3 h-3" />
            </Link>
          </motion.div>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((team, idx) => (
              <motion.div key={team.id} variants={item} className="bg-card card-shadow rounded-xl px-4 py-3 flex items-center gap-4 hover:card-shadow-hover transition-shadow">
                <span className="font-display text-xl w-8 text-center tabular-nums text-muted-foreground">{idx + 1}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: team.color, color: '#fff' }}>
                  {team.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{team.name}</div>
                  <div className="text-xs text-muted-foreground">{team.faculty}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg tabular-nums">{team.total_points.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground tabular-nums">{team.wins}W {team.draws}D {team.losses}L</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="font-display text-lg tracking-wider gradient-text">THE GAMES</span>
          <p className="text-xs text-muted-foreground mt-1">DÍAS EAFIT 2026 — Organización Estudiantil EAFIT</p>
        </div>
      </footer>
    </div>
  );
}
