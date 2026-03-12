import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Check, Ban, Clock } from "lucide-react";
import { demoTeams, demoMatchups } from "@/data/demo";
import AdminLayout from "@/components/AdminLayout";

interface DemoBet {
  id: number;
  teamName: string;
  teamColor: string;
  matchLabel: string;
  amount: number;
  prediction: string;
  status: 'pending' | 'won' | 'lost';
}

const demoBets: DemoBet[] = [
  { id: 1, teamName: "Dragones", teamColor: "#e63946", matchLabel: "Fénix vs Cerbero", amount: 300, prediction: "Fénix", status: 'pending' },
  { id: 2, teamName: "Titanes", teamColor: "#2a9d8f", matchLabel: "Leones vs Vikingos", amount: 500, prediction: "Empate", status: 'pending' },
  { id: 3, teamName: "Águilas", teamColor: "#f4a261", matchLabel: "Lobos vs Halcones", amount: 200, prediction: "Halcones", status: 'won' },
  { id: 4, teamName: "Samurais", teamColor: "#6a0572", matchLabel: "Dragones vs Cerbero", amount: 1000, prediction: "Dragones", status: 'lost' },
  { id: 5, teamName: "Corsarios", teamColor: "#1b998b", matchLabel: "Titanes vs Minotauros", amount: 750, prediction: "Titanes", status: 'pending' },
];

export default function AdminBetting() {
  const [bets] = useState(demoBets);

  return (
    <AdminLayout>
      <div>
        <h1 className="font-display text-3xl mb-1">SISTEMA DE APUESTAS</h1>
        <p className="text-sm text-muted-foreground mb-6">Control y gestión de apuestas entre equipos</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Apuestas", value: bets.length, icon: DollarSign, color: "text-accent" },
            { label: "Pendientes", value: bets.filter(b => b.status === 'pending').length, icon: Clock, color: "text-primary" },
            { label: "Ganadas", value: bets.filter(b => b.status === 'won').length, icon: Check, color: "text-success" },
            { label: "Perdidas", value: bets.filter(b => b.status === 'lost').length, icon: Ban, color: "text-destructive" },
          ].map(s => (
            <div key={s.label} className="bg-card card-shadow rounded-xl p-4">
              <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
              <div className="font-display text-2xl tabular-nums">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bets List */}
        <div className="bg-card card-shadow rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Equipo</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Partido</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Predicción</th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Monto</th>
                  <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => (
                  <tr key={bet.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: bet.teamColor }} />
                        <span className="font-medium">{bet.teamName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{bet.matchLabel}</td>
                    <td className="px-4 py-3">{bet.prediction}</td>
                    <td className="px-4 py-3 text-right font-display text-base tabular-nums">{bet.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        bet.status === 'pending' ? 'bg-accent/20 text-accent' :
                        bet.status === 'won' ? 'bg-success/20 text-success' :
                        'bg-destructive/20 text-destructive'
                      }`}>
                        {bet.status === 'pending' ? 'Pendiente' : bet.status === 'won' ? 'Ganada' : 'Perdida'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
