import { motion } from "framer-motion";
import { CalendarClock, MapPin } from "lucide-react";
import { demoTeams, demoCompetitions, demoMatchups } from "@/data/demo";
import AdminLayout from "@/components/AdminLayout";

export default function AdminRotations() {
  // Create round-based rotation view
  const rounds = Array.from({ length: 5 }, (_, roundIdx) => ({
    round: roundIdx + 1,
    matches: demoMatchups.slice(roundIdx * 3, roundIdx * 3 + 3),
  }));

  return (
    <AdminLayout>
      <div>
        <div className="mb-6">
          <h1 className="font-display text-3xl">ROTACIONES</h1>
          <p className="text-sm text-muted-foreground">Programación de equipos por rondas y bases</p>
        </div>

        <div className="space-y-6">
          {rounds.map((round) => (
            <motion.div
              key={round.round}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: round.round * 0.05 }}
              className="bg-card card-shadow rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                  R{round.round}
                </div>
                <div>
                  <h3 className="font-display text-lg">RONDA {round.round}</h3>
                  <p className="text-xs text-muted-foreground">
                    {round.round <= 2 ? 'Completada' : round.round === 3 ? 'En Progreso' : 'Pendiente'}
                  </p>
                </div>
                <div className="ml-auto">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    round.round <= 2 ? 'bg-success/20 text-success' :
                    round.round === 3 ? 'bg-accent/20 text-accent live-pulse' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {round.round <= 2 ? '✓ Completa' : round.round === 3 ? '● En Vivo' : 'Pendiente'}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                {round.matches.map((match) => (
                  <div key={match.id} className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3" />
                      {match.competition.title} — {match.competition.location}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: match.teamA.color, color: '#fff' }}>
                          {match.teamA.number}
                        </div>
                        <span className="text-xs font-medium">{match.teamA.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-display">VS</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{match.teamB.name}</span>
                        <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: match.teamB.color, color: '#fff' }}>
                          {match.teamB.number}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
