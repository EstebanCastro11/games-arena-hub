import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Trophy, AlertCircle } from "lucide-react";
import { demoTeams, demoCompetitions } from "@/data/demo";
import AdminLayout from "@/components/AdminLayout";

export default function AdminScoring() {
  const [day, setDay] = useState<1 | 2>(1);
  const [competitionId, setCompetitionId] = useState("");
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [result, setResult] = useState<"teamA" | "teamB" | "draw" | "">("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const dayComps = demoCompetitions.filter(c => c.day === day);
  const selectedComp = demoCompetitions.find(c => c.id === Number(competitionId));
  const isMacro = selectedComp?.type === 'macro';

  const getPoints = () => {
    if (!result) return { a: 0, b: 0 };
    const win = isMacro ? 2000 : 1000;
    const draw = isMacro ? 1000 : 500;
    if (result === 'teamA') return { a: win, b: 0 };
    if (result === 'teamB') return { a: 0, b: win };
    return { a: draw, b: draw };
  };

  const points = getPoints();
  const teamA = demoTeams.find(t => t.id === Number(teamAId));
  const teamB = demoTeams.find(t => t.id === Number(teamBId));

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setCompetitionId("");
      setTeamAId("");
      setTeamBId("");
      setResult("");
      setNotes("");
    }, 2000);
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl mb-1">REGISTRAR PUNTAJE</h1>
        <p className="text-sm text-muted-foreground mb-6">Ingresa el resultado de un enfrentamiento</p>

        <div className="bg-card card-shadow rounded-2xl p-6 space-y-5">
          {/* Day selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Día</label>
            <div className="flex gap-2">
              {[1, 2].map(d => (
                <button
                  key={d}
                  onClick={() => { setDay(d as 1 | 2); setCompetitionId(""); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    day === d ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  Día {d}
                </button>
              ))}
            </div>
          </div>

          {/* Competition */}
          <div>
            <label className="text-sm font-medium mb-2 block">Competencia / Base</label>
            <select
              value={competitionId}
              onChange={e => setCompetitionId(e.target.value)}
              className="w-full bg-background rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
            >
              <option value="">Seleccionar...</option>
              {dayComps.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.type === 'macro' ? '(MACRO)' : ''} — {c.location}
                </option>
              ))}
            </select>
          </div>

          {/* Teams */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Equipo A</label>
              <select
                value={teamAId}
                onChange={e => setTeamAId(e.target.value)}
                className="w-full bg-background rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
              >
                <option value="">Seleccionar...</option>
                {demoTeams.filter(t => t.id !== Number(teamBId)).map(t => (
                  <option key={t.id} value={t.id}>#{t.number} {t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Equipo B</label>
              <select
                value={teamBId}
                onChange={e => setTeamBId(e.target.value)}
                className="w-full bg-background rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
              >
                <option value="">Seleccionar...</option>
                {demoTeams.filter(t => t.id !== Number(teamAId)).map(t => (
                  <option key={t.id} value={t.id}>#{t.number} {t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Result */}
          {teamAId && teamBId && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
              <label className="text-sm font-medium mb-2 block">Resultado</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setResult("teamA")}
                  className={`py-4 rounded-xl text-sm font-medium transition-all border-2 ${
                    result === 'teamA' ? 'border-success bg-success/10 text-success' : 'border-border text-muted-foreground hover:border-foreground/20'
                  }`}
                >
                  <div className="font-display text-lg">{teamA?.name}</div>
                  <div className="text-xs mt-1">Gana</div>
                </button>
                <button
                  onClick={() => setResult("draw")}
                  className={`py-4 rounded-xl text-sm font-medium transition-all border-2 ${
                    result === 'draw' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-foreground/20'
                  }`}
                >
                  <div className="font-display text-lg">EMPATE</div>
                  <div className="text-xs mt-1">Draw</div>
                </button>
                <button
                  onClick={() => setResult("teamB")}
                  className={`py-4 rounded-xl text-sm font-medium transition-all border-2 ${
                    result === 'teamB' ? 'border-success bg-success/10 text-success' : 'border-border text-muted-foreground hover:border-foreground/20'
                  }`}
                >
                  <div className="font-display text-lg">{teamB?.name}</div>
                  <div className="text-xs mt-1">Gana</div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Points Preview */}
          {result && teamA && teamB && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-secondary/50 rounded-xl p-4"
            >
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Vista previa de puntaje {isMacro && '(MACRO BASE)'}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: teamA.color }} />
                  <span className="text-sm font-medium">{teamA.name}</span>
                </div>
                <span className="font-display text-2xl tabular-nums gradient-text">+{points.a.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: teamB.color }} />
                  <span className="text-sm font-medium">{teamB.name}</span>
                </div>
                <span className="font-display text-2xl tabular-nums gradient-text">+{points.b.toLocaleString()}</span>
              </div>
            </motion.div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones, penalizaciones, etc."
              rows={2}
              className="w-full bg-background rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!competitionId || !teamAId || !teamBId || !result || submitted}
            className={`w-full py-3.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              submitted
                ? 'bg-success text-success-foreground'
                : 'gradient-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
            }`}
          >
            {submitted ? (
              <>
                <Check className="w-4 h-4" /> ¡Puntaje Registrado!
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" /> Guardar Resultado
              </>
            )}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
