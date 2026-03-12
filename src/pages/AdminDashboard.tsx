import { motion } from "framer-motion";
import { Users, Trophy, Swords, ClipboardList, TrendingUp, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { demoTeams, demoCompetitions, demoMatchups, demoAnnouncements } from "@/data/demo";
import AdminLayout from "@/components/AdminLayout";

const stats = [
  { icon: Users, label: "Equipos", value: "30", color: "text-primary" },
  { icon: Trophy, label: "Competencias", value: demoCompetitions.length.toString(), color: "text-accent" },
  { icon: Swords, label: "Partidos Completados", value: demoMatchups.filter(m => m.status === 'completed').length.toString(), color: "text-success" },
  { icon: Clock, label: "En Progreso", value: demoMatchups.filter(m => m.status === 'in_progress').length.toString(), color: "text-primary" },
  { icon: ClipboardList, label: "Pendientes", value: demoMatchups.filter(m => m.status === 'pending').length.toString(), color: "text-muted-foreground" },
  { icon: DollarSign, label: "Apuestas Activas", value: "47", color: "text-accent" },
];

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function AdminDashboard() {
  const completedPercent = Math.round((demoMatchups.filter(m => m.status === 'completed').length / demoMatchups.length) * 100);

  return (
    <AdminLayout>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        <motion.div variants={item}>
          <h1 className="font-display text-3xl md:text-4xl mb-1">PANEL DE CONTROL</h1>
          <p className="text-sm text-muted-foreground mb-6">Día 1 — THE GAMES DÍAS EAFIT 2026</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              className="bg-card card-shadow rounded-xl p-4"
            >
              <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
              <div className="font-display text-2xl tabular-nums">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <motion.div variants={item} className="bg-card card-shadow rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg">PROGRESO DEL EVENTO</h3>
            <span className="font-display text-2xl gradient-text tabular-nums">{completedPercent}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completedPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Día 1: {demoCompetitions.filter(c => c.day === 1 && c.active).length}/15 bases activas</span>
            <span>Día 2: 0/15 bases activas</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Matches */}
          <motion.div variants={item} className="bg-card card-shadow rounded-xl p-5">
            <h3 className="font-display text-lg mb-4">ENFRENTAMIENTOS RECIENTES</h3>
            <div className="space-y-3">
              {demoMatchups.slice(0, 6).map((match) => (
                <div key={match.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className={`w-2 h-2 rounded-full ${
                    match.status === 'completed' ? 'bg-success' :
                    match.status === 'in_progress' ? 'bg-accent live-pulse' : 'bg-muted-foreground'
                  }`} />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: match.teamA.color, color: '#fff' }}>
                      {match.teamA.number}
                    </div>
                    <span className="text-xs truncate">{match.teamA.name}</span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span className="text-xs truncate">{match.teamB.name}</span>
                    <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: match.teamB.color, color: '#fff' }}>
                      {match.teamB.number}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    match.status === 'completed' ? 'bg-success/20 text-success' :
                    match.status === 'in_progress' ? 'bg-accent/20 text-accent' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {match.status === 'completed' ? 'Finalizado' : match.status === 'in_progress' ? 'En Vivo' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Announcements */}
          <motion.div variants={item} className="bg-card card-shadow rounded-xl p-5">
            <h3 className="font-display text-lg mb-4">ANUNCIOS RECIENTES</h3>
            <div className="space-y-3">
              {demoAnnouncements.map((a) => (
                <div key={a.id} className={`p-3 rounded-lg border ${
                  a.type === 'urgent' ? 'border-destructive/30 bg-destructive/5' :
                  a.type === 'warning' ? 'border-accent/30 bg-accent/5' :
                  'border-border bg-secondary/30'
                }`}>
                  <p className="text-sm">{a.message}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {new Date(a.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Top Teams */}
        <motion.div variants={item} className="bg-card card-shadow rounded-xl p-5 mt-6">
          <h3 className="font-display text-lg mb-4">TOP 10 EQUIPOS</h3>
          <div className="space-y-2">
            {[...demoTeams].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10).map((team, idx) => (
              <div key={team.id} className="flex items-center gap-3 py-2">
                <span className={`font-display text-lg w-6 text-center tabular-nums ${idx < 3 ? 'gradient-text' : 'text-muted-foreground'}`}>
                  {idx + 1}
                </span>
                <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: team.color, color: '#fff' }}>
                  {team.number}
                </div>
                <span className="flex-1 text-sm font-medium">{team.name}</span>
                <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full"
                    style={{ width: `${(team.totalPoints / demoTeams.reduce((max, t) => Math.max(max, t.totalPoints), 0)) * 100}%` }}
                  />
                </div>
                <span className="font-display text-sm tabular-nums w-16 text-right">{team.totalPoints.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
}
