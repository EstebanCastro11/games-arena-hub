import { motion } from "framer-motion";
import { CalendarClock, MapPin } from "lucide-react";
import { useRotations, useAllMatchupsWithDetails } from "@/hooks/useGameData";
import AdminLayout from "@/components/AdminLayout";

export default function AdminRotations() {
  const { data: rotations = [] } = useRotations();
  const { data: allMatchups = [] } = useAllMatchupsWithDetails();

  return (
    <AdminLayout>
      <div>
        <div className="mb-6">
          <h1 className="font-display text-3xl">ROTACIONES</h1>
          <p className="text-sm text-muted-foreground">Programación de equipos por rondas y bases</p>
        </div>

        <div className="space-y-6">
          {rotations.map((rotation: any) => {
            const rotMatchups = allMatchups.filter((m: any) => m.rotation?.rotation_number === rotation.rotation_number && m.rotation?.day === rotation.day);
            return (
              <motion.div key={rotation.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card card-shadow rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                    R{rotation.rotation_number}
                  </div>
                  <div>
                    <h3 className="font-display text-lg">DÍA {rotation.day} — RONDA {rotation.rotation_number}</h3>
                    <p className="text-xs text-muted-foreground">{rotMatchups.length} enfrentamientos</p>
                  </div>
                  <div className="ml-auto">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rotation.status === 'completed' ? 'bg-success/20 text-success' :
                      rotation.status === 'in_progress' ? 'bg-accent/20 text-accent live-pulse' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {rotation.status === 'completed' ? '✓ Completa' : rotation.status === 'in_progress' ? '● En Vivo' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {rotMatchups.map((match: any) => (
                    <div key={match.id} className="bg-secondary/30 rounded-lg p-3">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3" />
                        {match.base?.name}
                        {match.base?.base_type === 'macro' && <span className="text-accent ml-1">★</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold"
                            style={{ backgroundColor: match.team_a?.color, color: '#fff' }}>{match.team_a?.number}</div>
                          <span className="text-[11px] font-medium truncate max-w-[50px]">{match.team_a?.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-display mx-1">VS</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-medium truncate max-w-[50px]">{match.team_b?.name}</span>
                          <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold"
                            style={{ backgroundColor: match.team_b?.color, color: '#fff' }}>{match.team_b?.number}</div>
                        </div>
                      </div>
                      {match.result && match.result.length > 0 && (
                        <div className="mt-2 text-[10px] text-center">
                          <span className="text-success font-medium">
                            {match.result[0].result === 'team_a' ? `${match.team_a?.name} ganó` :
                             match.result[0].result === 'team_b' ? `${match.team_b?.name} ganó` : 'Empate'}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            ({match.result[0].team_a_points} - {match.result[0].team_b_points})
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
