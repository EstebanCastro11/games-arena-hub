import { motion } from "framer-motion";
import { Trophy, Users as UsersIcon, Calendar, LogOut, Swords } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { leaderboard, demoMatchups } from "@/data/demo";
import { Link } from "react-router-dom";

export default function CaptainDashboard() {
  const { displayName, signOut } = useAuth();
  const myTeam = leaderboard[5]; // Simulated team assignment
  const upcomingMatches = demoMatchups.filter(m => m.status === 'pending').slice(0, 3);

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
            <button onClick={signOut} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground mb-1">Bienvenido, Capitán</p>
          <h1 className="font-display text-4xl gradient-text mb-8">{displayName || "Capitán"}</h1>
        </motion.div>

        {/* Team Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card card-shadow rounded-2xl p-6 mb-6 glow-primary"
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold border-2"
              style={{ backgroundColor: myTeam.color, borderColor: `${myTeam.color}80`, color: '#fff' }}
            >
              {myTeam.number}
            </div>
            <div>
              <h2 className="font-display text-3xl">{myTeam.name}</h2>
              <p className="text-sm text-muted-foreground">{myTeam.faculty} • {myTeam.membersCount} miembros</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Puntos", value: myTeam.totalPoints.toLocaleString() },
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card card-shadow rounded-xl p-5 mb-6"
        >
          <h3 className="font-display text-lg mb-3">TU POSICIÓN EN LA CLASIFICACIÓN</h3>
          <div className="flex items-center gap-4">
            <span className="font-display text-5xl gradient-text">#{leaderboard.findIndex(t => t.id === myTeam.id) + 1}</span>
            <div className="flex-1">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full"
                  style={{ width: `${(myTeam.totalPoints / leaderboard[0].totalPoints) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {myTeam.totalPoints.toLocaleString()} / {leaderboard[0].totalPoints.toLocaleString()} pts del líder
              </p>
            </div>
          </div>
        </motion.div>

        {/* Upcoming Matches */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card card-shadow rounded-xl p-5 mb-6"
        >
          <h3 className="font-display text-lg mb-4 flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" /> PRÓXIMOS ENFRENTAMIENTOS
          </h3>
          <div className="space-y-3">
            {upcomingMatches.map(match => (
              <div key={match.id} className="bg-secondary/30 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: match.teamA.color, color: '#fff' }}>
                    {match.teamA.number}
                  </div>
                  <span className="text-sm">{match.teamA.name}</span>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <span className="text-sm">{match.teamB.name}</span>
                  <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: match.teamB.color, color: '#fff' }}>
                    {match.teamB.number}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{match.competition.title}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Betting Balance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card card-shadow rounded-xl p-5"
        >
          <h3 className="font-display text-lg mb-3">BALANCE DE APUESTAS</h3>
          <div className="flex items-center justify-between">
            <span className="font-display text-4xl tabular-nums gradient-text">{myTeam.bettingBalance.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">créditos disponibles</span>
          </div>
          <Link
            to="/apuestas"
            className="mt-4 block text-center gradient-primary py-2.5 rounded-lg text-sm font-medium text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Ir a Apuestas
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
