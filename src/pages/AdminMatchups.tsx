import { useState } from "react";
import { motion } from "framer-motion";
import { Swords, RefreshCw, Shuffle } from "lucide-react";
import { demoMatchups, demoTeams } from "@/data/demo";
import AdminLayout from "@/components/AdminLayout";

export default function AdminMatchups() {
  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl">ENFRENTAMIENTOS</h1>
            <p className="text-sm text-muted-foreground">Llaves y emparejamientos del torneo</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-card card-shadow px-4 py-2.5 rounded-lg text-sm font-medium text-foreground hover:card-shadow-hover transition-shadow flex items-center gap-2">
              <Shuffle className="w-4 h-4" /> Aleatorio
            </button>
            <button className="gradient-primary px-4 py-2.5 rounded-lg text-sm font-medium text-primary-foreground hover:scale-105 active:scale-95 transition-transform flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Regenerar Llaves
            </button>
          </div>
        </div>

        <div className="bg-card card-shadow rounded-xl p-5 mb-6">
          <h3 className="font-display text-lg mb-2">FORMATO: SEEDED (1 vs 30)</h3>
          <p className="text-xs text-muted-foreground">
            Los equipos se emparejan por semilla: el equipo #1 contra el #30, el #2 contra el #29, etc.
            Esto asegura enfrentamientos equilibrados en la primera ronda.
          </p>
        </div>

        <div className="space-y-3">
          {demoMatchups.map((match, idx) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-card card-shadow rounded-xl p-4 hover:card-shadow-hover transition-shadow"
            >
              <div className="flex items-center gap-4">
                {/* Match number */}
                <div className="w-10 text-center">
                  <span className="font-display text-lg text-muted-foreground">R{idx + 1}</span>
                </div>

                {/* Team A */}
                <div className="flex-1 flex items-center gap-3 justify-end">
                  <span className="font-medium text-sm text-right">{match.teamA.name}</span>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: match.teamA.color, color: '#fff' }}
                  >
                    {match.teamA.number}
                  </div>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center px-3">
                  <Swords className="w-4 h-4 text-primary mb-1" />
                  <span className="font-display text-xs text-muted-foreground">VS</span>
                </div>

                {/* Team B */}
                <div className="flex-1 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: match.teamB.color, color: '#fff' }}
                  >
                    {match.teamB.number}
                  </div>
                  <span className="font-medium text-sm">{match.teamB.name}</span>
                </div>

                {/* Status */}
                <div className="w-24 text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    match.status === 'completed' ? 'bg-success/20 text-success' :
                    match.status === 'in_progress' ? 'bg-accent/20 text-accent' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {match.status === 'completed' ? 'Finalizado' : match.status === 'in_progress' ? 'En Vivo' : 'Pendiente'}
                  </span>
                </div>

                {/* Competition */}
                <div className="hidden md:block w-20 text-right">
                  <span className="text-xs text-muted-foreground">{match.competition.title}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
