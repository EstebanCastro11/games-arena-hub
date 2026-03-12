import { motion } from "framer-motion";
import { Swords, RefreshCw } from "lucide-react";
import { useAllMatchupsWithDetails, useRotations } from "@/hooks/useGameData";
import AdminLayout from "@/components/AdminLayout";

export default function AdminMatchups() {
  const { data: allMatchups = [], isLoading } = useAllMatchupsWithDetails();
  const { data: rotations = [] } = useRotations();

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl">ENFRENTAMIENTOS</h1>
            <p className="text-sm text-muted-foreground">{allMatchups.length} enfrentamientos totales en {rotations.length} rotaciones</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : (
          <div className="space-y-3">
            {allMatchups.map((match: any, idx: number) => (
              <motion.div key={match.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }} className="bg-card card-shadow rounded-xl p-4 hover:card-shadow-hover transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-16 text-center shrink-0">
                    <span className="text-[10px] text-muted-foreground block">D{match.rotation?.day} R{match.rotation?.rotation_number}</span>
                    <span className="text-xs text-muted-foreground">{match.base?.name}</span>
                    {match.base?.base_type === 'macro' && <span className="block text-[9px] text-accent">MACRO</span>}
                  </div>

                  <div className="flex-1 flex items-center gap-3 justify-end">
                    <span className="font-medium text-sm text-right hidden sm:block">{match.team_a?.name}</span>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: match.team_a?.color, color: '#fff' }}>{match.team_a?.number}</div>
                  </div>

                  <div className="flex flex-col items-center px-2">
                    <Swords className="w-4 h-4 text-primary mb-1" />
                    <span className="font-display text-xs text-muted-foreground">VS</span>
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: match.team_b?.color, color: '#fff' }}>{match.team_b?.number}</div>
                    <span className="font-medium text-sm hidden sm:block">{match.team_b?.name}</span>
                  </div>

                  <div className="w-24 text-right shrink-0">
                    {match.result && match.result.length > 0 ? (
                      <div>
                        <span className="text-xs text-success font-medium">
                          {match.result[0].result === 'team_a' ? match.team_a?.name :
                           match.result[0].result === 'team_b' ? match.team_b?.name : 'Empate'}
                        </span>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {match.result[0].team_a_points}-{match.result[0].team_b_points}
                        </div>
                      </div>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        match.status === 'in_progress' ? 'bg-accent/20 text-accent' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {match.status === 'in_progress' ? 'En Vivo' : 'Pendiente'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
