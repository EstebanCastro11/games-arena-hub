import { motion } from "framer-motion";
import { Users, Trophy, Swords, ClipboardList, TrendingUp, Clock, DollarSign } from "lucide-react";
import { useDashboardStats, useLeaderboard, useAllMatchupsWithDetails, useAnnouncements } from "@/hooks/useGameData";
import AdminLayout from "@/components/AdminLayout";

const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const { data: stats } = useDashboardStats();
  const { data: leaderboard = [] } = useLeaderboard();
  const { data: matchups = [] } = useAllMatchupsWithDetails();
  const { data: announcements = [] } = useAnnouncements();

  const completedPercent = stats ? Math.round((stats.completedMatchups / Math.max(stats.totalMatchups, 1)) * 100) : 0;

  const statCards = [
    { icon: Users, label: "Equipos", value: stats?.totalTeams || 0, color: "text-primary" },
    { icon: Trophy, label: "Bases", value: stats?.totalBases || 0, color: "text-accent" },
    { icon: Swords, label: "Completados", value: stats?.completedMatchups || 0, color: "text-success" },
    { icon: Clock, label: "En Progreso", value: stats?.inProgressMatchups || 0, color: "text-primary" },
    { icon: ClipboardList, label: "Pendientes", value: stats?.pendingMatchups || 0, color: "text-muted-foreground" },
    { icon: DollarSign, label: "Apuestas", value: stats?.totalBets || 0, color: "text-accent" },
  ];

  return (
    <AdminLayout>
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
        <motion.div variants={item}>
          <h1 className="font-display text-3xl md:text-4xl mb-1">PANEL DE CONTROL</h1>
          <p className="text-sm text-muted-foreground mb-6">Día 1 — THE GAMES DÍAS EAFIT 2026</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {statCards.map((stat) => (
            <motion.div key={stat.label} variants={item} className="bg-card card-shadow rounded-xl p-4">
              <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
              <div className="font-display text-2xl tabular-nums">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={item} className="bg-card card-shadow rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg">PROGRESO DEL EVENTO</h3>
            <span className="font-display text-2xl gradient-text tabular-nums">{completedPercent}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full gradient-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${completedPercent}%` }} transition={{ duration: 1 }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Rotaciones completadas: {stats?.rotations.filter((r: any) => r.status === 'completed').length || 0}</span>
            <span>En progreso: {stats?.rotations.filter((r: any) => r.status === 'in_progress').length || 0}</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div variants={item} className="bg-card card-shadow rounded-xl p-5">
            <h3 className="font-display text-lg mb-4">ENFRENTAMIENTOS RECIENTES</h3>
            <div className="space-y-3">
              {matchups.slice(0, 6).map((match: any) => (
                <div key={match.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className={`w-2 h-2 rounded-full ${
                    match.status === 'completed' ? 'bg-success' : match.status === 'in_progress' ? 'bg-accent live-pulse' : 'bg-muted-foreground'
                  }`} />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: match.team_a?.color, color: '#fff' }}>{match.team_a?.number}</div>
                    <span className="text-xs truncate">{match.team_a?.name}</span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span className="text-xs truncate">{match.team_b?.name}</span>
                    <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: match.team_b?.color, color: '#fff' }}>{match.team_b?.number}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    match.status === 'completed' ? 'bg-success/20 text-success' : match.status === 'in_progress' ? 'bg-accent/20 text-accent' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {match.status === 'completed' ? 'Finalizado' : match.status === 'in_progress' ? 'En Vivo' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-card card-shadow rounded-xl p-5">
            <h3 className="font-display text-lg mb-4">ANUNCIOS RECIENTES</h3>
            <div className="space-y-3">
              {announcements.map((a: any) => (
                <div key={a.id} className={`p-3 rounded-lg border ${
                  a.type === 'urgent' ? 'border-destructive/30 bg-destructive/5' : a.type === 'warning' ? 'border-accent/30 bg-accent/5' : 'border-border bg-secondary/30'
                }`}>
                  <p className="text-sm">{a.message}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {new Date(a.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div variants={item} className="bg-card card-shadow rounded-xl p-5 mt-6">
          <h3 className="font-display text-lg mb-4">TOP 10 EQUIPOS</h3>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((team, idx) => (
              <div key={team.id} className="flex items-center gap-3 py-2">
                <span className={`font-display text-lg w-6 text-center tabular-nums ${idx < 3 ? 'gradient-text' : 'text-muted-foreground'}`}>{idx + 1}</span>
                <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: team.color, color: '#fff' }}>{team.number}</div>
                <span className="flex-1 text-sm font-medium">{team.name}</span>
                <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full gradient-primary rounded-full" style={{ width: `${(team.total_points / Math.max(leaderboard[0]?.total_points || 1, 1)) * 100}%` }} />
                </div>
                <span className="font-display text-sm tabular-nums w-16 text-right">{team.total_points.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
}
