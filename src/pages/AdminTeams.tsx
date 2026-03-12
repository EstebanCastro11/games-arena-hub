import { useState } from "react";
import { motion } from "framer-motion";
import { Search, LayoutGrid, List, Plus, Users as UsersIcon } from "lucide-react";
import { useTeams } from "@/hooks/useGameData";
import AdminLayout from "@/components/AdminLayout";

type ViewMode = "cards" | "table";

export default function AdminTeams() {
  const [view, setView] = useState<ViewMode>("cards");
  const [search, setSearch] = useState("");
  const { data: teams = [], isLoading } = useTeams();

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.faculty || '').toLowerCase().includes(search.toLowerCase()) ||
    t.number.toString().includes(search)
  );

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl">EQUIPOS</h1>
            <p className="text-sm text-muted-foreground">{teams.length} equipos registrados</p>
          </div>
          <button className="gradient-primary px-4 py-2.5 rounded-lg text-sm font-medium text-primary-foreground hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> Nuevo Equipo
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar equipo..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card card-shadow rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background" />
          </div>
          <div className="flex bg-card card-shadow rounded-lg p-1">
            <button onClick={() => setView("cards")} className={`p-2 rounded-md transition-colors ${view === 'cards' ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("table")} className={`p-2 rounded-md transition-colors ${view === 'table' ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando equipos...</div>
        ) : view === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((team, idx) => (
              <motion.div key={team.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                className="bg-card card-shadow rounded-xl p-5 hover:card-shadow-hover transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border-2 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: team.color, borderColor: `${team.color}60`, color: '#fff' }}>{team.number}</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    team.status === 'active' ? 'bg-success/20 text-success' : team.status === 'disqualified' ? 'bg-destructive/20 text-destructive' : 'bg-secondary text-muted-foreground'
                  }`}>{team.status === 'active' ? 'Activo' : team.status === 'disqualified' ? 'Descalificado' : 'Inactivo'}</span>
                </div>
                <h3 className="font-display text-xl mb-0.5">{team.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{team.faculty || 'Sin facultad'}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-secondary/50 rounded-lg py-1.5">
                    <div className="font-display text-sm tabular-nums">{team.wins}</div>
                    <div className="text-[10px] text-muted-foreground">Victorias</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg py-1.5">
                    <div className="font-display text-sm tabular-nums">{team.draws}</div>
                    <div className="text-[10px] text-muted-foreground">Empates</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg py-1.5">
                    <div className="font-display text-sm tabular-nums">{team.losses}</div>
                    <div className="text-[10px] text-muted-foreground">Derrotas</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <UsersIcon className="w-3 h-3" /> {team.members_count} miembros
                  </div>
                  <div className="font-display text-lg tabular-nums gradient-text">{team.total_points.toLocaleString()}</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-card card-shadow rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">#</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Equipo</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Facultad</th>
                    <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">V</th>
                    <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">E</th>
                    <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">D</th>
                    <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Puntos</th>
                    <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((team) => (
                    <tr key={team.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: team.color, color: '#fff' }}>{team.number}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">{team.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{team.faculty || '-'}</td>
                      <td className="px-4 py-3 text-center tabular-nums">{team.wins}</td>
                      <td className="px-4 py-3 text-center tabular-nums">{team.draws}</td>
                      <td className="px-4 py-3 text-center tabular-nums">{team.losses}</td>
                      <td className="px-4 py-3 text-right font-display text-base tabular-nums">{team.total_points.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          team.status === 'active' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                        }`}>{team.status === 'active' ? 'Activo' : team.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
