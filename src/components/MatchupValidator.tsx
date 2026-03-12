import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Matchup {
  id: string;
  team_a: { id: string; name: string; number: number; color: string } | null;
  team_b: { id: string; name: string; number: number; color: string } | null;
  rotation: { day: number; rotation_number: number } | null;
  base: { name: string } | null;
}

interface ValidationResult {
  duplicates: {
    key: string;
    teamA: { id: string; name: string; number: number; color: string };
    teamB: { id: string; name: string; number: number; color: string };
    occurrences: { rotationDay: number; rotationNumber: number; base: string }[];
  }[];
  selfMatchups: {
    matchId: string;
    team: { name: string; number: number };
    rotationDay: number;
    rotationNumber: number;
  }[];
  teamAppearancesPerRotation: {
    teamName: string;
    teamNumber: number;
    rotationDay: number;
    rotationNumber: number;
    count: number;
  }[];
  totalMatchups: number;
  uniquePairings: number;
}

function validate(matchups: Matchup[]): ValidationResult {
  const pairMap = new Map<string, {
    teamA: any; teamB: any;
    occurrences: { rotationDay: number; rotationNumber: number; base: string }[];
  }>();
  const selfMatchups: ValidationResult["selfMatchups"] = [];
  const rotationTeamCount = new Map<string, Map<string, number>>();

  for (const m of matchups) {
    if (!m.team_a || !m.team_b || !m.rotation) continue;

    // Self matchup check
    if (m.team_a.id === m.team_b.id) {
      selfMatchups.push({
        matchId: m.id,
        team: { name: m.team_a.name, number: m.team_a.number },
        rotationDay: m.rotation.day,
        rotationNumber: m.rotation.rotation_number,
      });
    }

    // Duplicate pairing check
    const ids = [m.team_a.id, m.team_b.id].sort();
    const key = `${ids[0]}__${ids[1]}`;
    if (!pairMap.has(key)) {
      pairMap.set(key, {
        teamA: ids[0] === m.team_a.id ? m.team_a : m.team_b,
        teamB: ids[0] === m.team_a.id ? m.team_b : m.team_a,
        occurrences: [],
      });
    }
    pairMap.get(key)!.occurrences.push({
      rotationDay: m.rotation.day,
      rotationNumber: m.rotation.rotation_number,
      base: m.base?.name || "?",
    });

    // Team appears more than once in same rotation
    const rotKey = `${m.rotation.day}-${m.rotation.rotation_number}`;
    if (!rotationTeamCount.has(rotKey)) rotationTeamCount.set(rotKey, new Map());
    const rc = rotationTeamCount.get(rotKey)!;
    for (const t of [m.team_a, m.team_b]) {
      rc.set(t.id, (rc.get(t.id) || 0) + 1);
    }
  }

  const duplicates = Array.from(pairMap.entries())
    .filter(([, v]) => v.occurrences.length > 1)
    .map(([key, v]) => ({ key, teamA: v.teamA, teamB: v.teamB, occurrences: v.occurrences }))
    .sort((a, b) => b.occurrences.length - a.occurrences.length);

  const teamAppearancesPerRotation: ValidationResult["teamAppearancesPerRotation"] = [];
  for (const [rotKey, teamMap] of rotationTeamCount) {
    const [day, rot] = rotKey.split("-").map(Number);
    for (const [teamId, count] of teamMap) {
      if (count > 1) {
        const m = matchups.find(x => x.team_a?.id === teamId || x.team_b?.id === teamId);
        const team = m?.team_a?.id === teamId ? m.team_a : m?.team_b;
        teamAppearancesPerRotation.push({
          teamName: team?.name || "?",
          teamNumber: team?.number || 0,
          rotationDay: day,
          rotationNumber: rot,
          count,
        });
      }
    }
  }

  return {
    duplicates,
    selfMatchups,
    teamAppearancesPerRotation,
    totalMatchups: matchups.length,
    uniquePairings: pairMap.size,
  };
}

export default function MatchupValidator({ matchups }: { matchups: Matchup[] }) {
  const [open, setOpen] = useState(false);
  const result = useMemo(() => validate(matchups), [matchups]);

  const totalIssues = result.duplicates.length + result.selfMatchups.length + result.teamAppearancesPerRotation.length;
  const isClean = totalIssues === 0;

  return (
    <div className="mb-6">
      <Button
        onClick={() => setOpen(!open)}
        variant={isClean ? "outline" : "destructive"}
        className="flex items-center gap-2 w-full justify-between"
      >
        <span className="flex items-center gap-2">
          {isClean ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          {isClean ? "Validación OK — Sin conflictos" : `⚠️ ${totalIssues} problema${totalIssues > 1 ? "s" : ""} encontrado${totalIssues > 1 ? "s" : ""}`}
        </span>
        <span className="flex items-center gap-2 text-xs">
          {result.totalMatchups} enfrentamientos · {result.uniquePairings} parejas únicas
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card card-shadow rounded-xl mt-3 p-5 space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SummaryCard label="Enfrentamientos" value={result.totalMatchups} icon={<Users className="w-4 h-4" />} />
                <SummaryCard label="Parejas únicas" value={result.uniquePairings} icon={<CheckCircle2 className="w-4 h-4" />} />
                <SummaryCard
                  label="Duplicados"
                  value={result.duplicates.length}
                  icon={<AlertTriangle className="w-4 h-4" />}
                  alert={result.duplicates.length > 0}
                />
                <SummaryCard
                  label="Otros problemas"
                  value={result.selfMatchups.length + result.teamAppearancesPerRotation.length}
                  icon={<ShieldAlert className="w-4 h-4" />}
                  alert={result.selfMatchups.length + result.teamAppearancesPerRotation.length > 0}
                />
              </div>

              {/* Duplicate Pairings */}
              {result.duplicates.length > 0 && (
                <div>
                  <h4 className="font-display text-sm text-destructive mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> ENFRENTAMIENTOS DUPLICADOS
                  </h4>
                  <ScrollArea className="max-h-80">
                    <div className="space-y-2">
                      {result.duplicates.map((dup) => (
                        <div key={dup.key} className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                          <div className="flex items-center gap-3 mb-2">
                            <TeamBadge team={dup.teamA} />
                            <span className="text-xs font-display text-muted-foreground">VS</span>
                            <TeamBadge team={dup.teamB} />
                            <Badge variant="destructive" className="ml-auto text-xs">
                              {dup.occurrences.length}x repetido
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {dup.occurrences.map((o, i) => (
                              <span key={i} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                                D{o.rotationDay} R{o.rotationNumber} · {o.base}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Self matchups */}
              {result.selfMatchups.length > 0 && (
                <div>
                  <h4 className="font-display text-sm text-destructive mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> EQUIPO VS SÍ MISMO
                  </h4>
                  <div className="space-y-1">
                    {result.selfMatchups.map((s) => (
                      <div key={s.matchId} className="text-sm bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                        #{s.team.number} {s.team.name} — D{s.rotationDay} R{s.rotationNumber}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-appearance in same rotation */}
              {result.teamAppearancesPerRotation.length > 0 && (
                <div>
                  <h4 className="font-display text-sm text-accent mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> EQUIPO APARECE MÁS DE 1 VEZ EN MISMA ROTACIÓN
                  </h4>
                  <div className="space-y-1">
                    {result.teamAppearancesPerRotation.map((t, i) => (
                      <div key={i} className="text-sm bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 flex items-center justify-between">
                        <span>#{t.teamNumber} {t.teamName}</span>
                        <span className="text-xs text-muted-foreground">
                          D{t.rotationDay} R{t.rotationNumber} — {t.count} veces
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All clear */}
              {isClean && (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                  <h4 className="font-display text-lg text-success">TODO CORRECTO</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    No hay enfrentamientos duplicados, equipos contra sí mismos, ni equipos en múltiples partidos por rotación.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({ label, value, icon, alert }: { label: string; value: number; icon: React.ReactNode; alert?: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center ${alert ? "bg-destructive/10 border border-destructive/20" : "bg-secondary/50"}`}>
      <div className={`flex items-center justify-center gap-1 mb-1 ${alert ? "text-destructive" : "text-muted-foreground"}`}>
        {icon}
        <span className="text-[10px] uppercase">{label}</span>
      </div>
      <span className={`font-display text-2xl ${alert ? "text-destructive" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function TeamBadge({ team }: { team: { name: string; number: number; color: string } }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white"
        style={{ backgroundColor: team.color }}
      >
        {team.number}
      </div>
      <span className="text-sm font-medium">{team.name}</span>
    </div>
  );
}
