import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MapPin, Zap, Star } from "lucide-react";
import { useBases } from "@/hooks/useGameData";
import AdminLayout from "@/components/AdminLayout";

type DayFilter = "all" | 1 | 2;

export default function AdminCompetitions() {
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const { data: bases = [], isLoading } = useBases();

  const filtered = dayFilter === "all" ? bases : bases.filter(b => b.day === dayFilter);

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl">BASES / COMPETENCIAS</h1>
            <p className="text-sm text-muted-foreground">{bases.length} bases registradas</p>
          </div>
          <button className="gradient-primary px-4 py-2.5 rounded-lg text-sm font-medium text-primary-foreground hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> Nueva Base
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {([
            { key: "all", label: "Todas" },
            { key: 1, label: "Día 1" },
            { key: 2, label: "Día 2" },
          ] as { key: DayFilter; label: string }[]).map((f) => (
            <button key={String(f.key)} onClick={() => setDayFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dayFilter === f.key ? "gradient-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
              }`}>{f.label}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((base, idx) => (
              <motion.div key={base.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                className="bg-card card-shadow rounded-xl p-5 hover:card-shadow-hover transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${base.base_type === 'macro' ? 'bg-accent/20' : 'bg-primary/20'}`}>
                    {base.base_type === 'macro' ? <Star className="w-5 h-5 text-accent" /> : <Zap className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {base.base_type === 'macro' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">MACRO</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${base.active ? 'bg-success/20 text-success' : 'bg-secondary text-muted-foreground'}`}>
                      {base.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
                <h3 className="font-display text-xl mb-1">{base.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{base.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {base.location}</div>
                  <span>•</span>
                  <span>Día {base.day}</span>
                  <span>•</span>
                  <span>{base.base_type === 'macro' ? '2000 pts' : '1000 pts'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
