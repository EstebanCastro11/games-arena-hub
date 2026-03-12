import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Target, Trophy } from "lucide-react";
import { demoTeams, demoMatchups } from "@/data/demo";
import { Link } from "react-router-dom";

export default function Betting() {
  const pendingMatches = demoMatchups.filter(m => m.status === 'pending');
  const topBettors = [...demoTeams].sort((a, b) => b.bettingBalance - a.bettingBalance).slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl tracking-wider">APUESTAS</span>
          </Link>
          <Link to="/login" className="gradient-primary px-3 py-1.5 rounded-lg text-xs font-medium text-primary-foreground">
            Entrar
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Betting Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          <div className="bg-card card-shadow rounded-xl p-4 text-center">
            <DollarSign className="w-5 h-5 text-accent mx-auto mb-1" />
            <div className="font-display text-2xl tabular-nums">47</div>
            <div className="text-[10px] text-muted-foreground">Apuestas Activas</div>
          </div>
          <div className="bg-card card-shadow rounded-xl p-4 text-center">
            <Target className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="font-display text-2xl tabular-nums">{pendingMatches.length}</div>
            <div className="text-[10px] text-muted-foreground">Partidos Abiertos</div>
          </div>
          <div className="bg-card card-shadow rounded-xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
            <div className="font-display text-2xl tabular-nums">78%</div>
            <div className="text-[10px] text-muted-foreground">Precisión Top</div>
          </div>
        </motion.div>

        {/* Open Matches for Betting */}
        <h2 className="font-display text-2xl mb-4">PARTIDOS ABIERTOS PARA APOSTAR</h2>
        <div className="space-y-3 mb-10">
          {pendingMatches.map((match, idx) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card card-shadow rounded-xl p-5"
            >
              <div className="text-xs text-muted-foreground mb-3">{match.competition.title} — {match.competition.location}</div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: match.teamA.color, color: '#fff' }}>
                    {match.teamA.number}
                  </div>
                  <span className="font-medium">{match.teamA.name}</span>
                </div>
                <span className="font-display text-xl text-muted-foreground">VS</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{match.teamB.name}</span>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: match.teamB.color, color: '#fff' }}>
                    {match.teamB.number}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button className="py-2 rounded-lg border-2 border-border text-sm font-medium hover:border-success hover:bg-success/10 hover:text-success transition-all">
                  {match.teamA.name}
                </button>
                <button className="py-2 rounded-lg border-2 border-border text-sm font-medium hover:border-accent hover:bg-accent/10 hover:text-accent transition-all">
                  Empate
                </button>
                <button className="py-2 rounded-lg border-2 border-border text-sm font-medium hover:border-success hover:bg-success/10 hover:text-success transition-all">
                  {match.teamB.name}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">Inicia sesión como capitán para apostar</p>
            </motion.div>
          ))}
        </div>

        {/* Betting Leaderboard */}
        <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" /> TOP APOSTADORES
        </h2>
        <div className="space-y-2">
          {topBettors.map((team, idx) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-card card-shadow rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <span className="font-display text-lg w-6 text-center tabular-nums text-muted-foreground">{idx + 1}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: team.color, color: '#fff' }}>
                {team.number}
              </div>
              <span className="flex-1 text-sm font-medium">{team.name}</span>
              <div className="flex items-center gap-1 text-accent">
                <DollarSign className="w-3 h-3" />
                <span className="font-display text-lg tabular-nums">{team.bettingBalance.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
