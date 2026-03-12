import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react";
import { useLeaderboard } from "@/hooks/useGameData";
import { Link } from "react-router-dom";

type DayFilter = "overall" | "day1" | "day2";

export default function Leaderboard() {
  const [filter, setFilter] = useState<DayFilter>("overall");
  const { data: leaderboard = [], isLoading } = useLeaderboard();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl tracking-wider">CLASIFICACIÓN</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success live-pulse" />
            <span className="text-xs text-muted-foreground">EN VIVO</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {([
            { key: "overall", label: "General" },
            { key: "day1", label: "Día 1" },
            { key: "day2", label: "Día 2" },
          ] as { key: DayFilter; label: string }[]).map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                filter === f.key ? "gradient-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
              }`}>{f.label}</button>
          ))}
        </div>

        {/* Top 3 Mini Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[leaderboard[1], leaderboard[0], leaderboard[2]].map((team, idx) => {
              const medals = ["🥈", "🥇", "🥉"];
              return (
                <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                  className={`bg-card card-shadow rounded-xl p-4 text-center ${idx === 1 ? "glow-primary" : ""}`}>
                  <div className="text-2xl mb-1">{medals[idx]}</div>
                  <div className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: team.color, color: '#fff' }}>{team.number}</div>
                  <div className="font-display text-lg leading-tight">{team.name}</div>
                  <div className="font-display text-xl tabular-nums gradient-text">{team.total_points.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground tabular-nums mt-1">{team.wins}W {team.draws}D {team.losses}L</div>
                </motion.div>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {leaderboard.map((team, idx) => {
                const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'same';
                return (
                  <motion.div key={team.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                    className="bg-card card-shadow rounded-xl px-4 py-3 flex items-center gap-3 hover:card-shadow-hover transition-shadow">
                    <span className={`font-display text-xl w-8 text-center tabular-nums ${idx < 3 ? "gradient-text" : "text-muted-foreground"}`}>{idx + 1}</span>
                    {trend === 'up' && <TrendingUp className="w-3 h-3 text-success shrink-0" />}
                    {trend === 'down' && <TrendingDown className="w-3 h-3 text-destructive shrink-0" />}
                    {trend === 'same' && <Minus className="w-3 h-3 text-muted-foreground shrink-0" />}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: team.color, color: '#fff' }}>{team.number}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{team.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{team.faculty}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-lg tabular-nums">{team.total_points.toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">{team.matches_played} partidos</div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
