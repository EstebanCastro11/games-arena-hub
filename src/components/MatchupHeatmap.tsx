import { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface Team {
  id: string;
  name: string;
  number: number;
  color: string;
}

interface Matchup {
  team_a: Team | null;
  team_b: Team | null;
  rotation?: { day: number; rotation_number: number } | null;
}

export default function MatchupHeatmap({ matchups }: { matchups: Matchup[] }) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (dayFilter === "all") return matchups;
    const day = parseInt(dayFilter);
    return matchups.filter(m => m.rotation?.day === day);
  }, [matchups, dayFilter]);

  const { teams, matrix, maxCount } = useMemo(() => {
    const teamMap = new Map<string, Team>();
    const countMap = new Map<string, number>();

    for (const m of filtered) {
      if (!m.team_a || !m.team_b) continue;
      teamMap.set(m.team_a.id, m.team_a);
      teamMap.set(m.team_b.id, m.team_b);

      const key = [m.team_a.id, m.team_b.id].sort().join("__");
      countMap.set(key, (countMap.get(key) || 0) + 1);
    }

    const teams = Array.from(teamMap.values()).sort((a, b) => a.number - b.number);
    let maxCount = 0;

    const matrix: number[][] = teams.map((tRow) =>
      teams.map((tCol) => {
        if (tRow.id === tCol.id) return -1;
        const key = [tRow.id, tCol.id].sort().join("__");
        const count = countMap.get(key) || 0;
        if (count > maxCount) maxCount = count;
        return count;
      })
    );

    return { teams, matrix, maxCount };
  }, [matchups]);

  if (teams.length === 0) return null;

  const cellSize = teams.length > 20 ? 22 : 28;
  const labelWidth = 40;

  const getCellColor = (count: number): string => {
    if (count === -1) return "hsl(var(--muted) / 0.3)";
    if (count === 0) return "hsl(var(--secondary))";
    if (count === 1) return "hsl(142 71% 45% / 0.6)"; // green - correct
    if (count === 2) return "hsl(38 92% 50% / 0.7)"; // orange - warning
    return "hsl(0 84% 60% / 0.8)"; // red - duplicate
  };

  return (
    <div>
      <h4 className="font-display text-sm text-muted-foreground mb-3 flex items-center gap-2">
        MATRIZ DE ENFRENTAMIENTOS
      </h4>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ background: getCellColor(0) }} /> 0 — No se enfrentan
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ background: getCellColor(1) }} /> 1 — Correcto
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ background: getCellColor(2) }} /> 2 — Advertencia
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ background: getCellColor(3) }} /> 3+ — Duplicado
        </span>
      </div>

      <ScrollArea className="max-h-[600px]">
        <div className="overflow-x-auto">
          <TooltipProvider delayDuration={0}>
            <div style={{ display: "inline-block" }}>
              {/* Header row */}
              <div className="flex">
                <div style={{ width: labelWidth, height: cellSize }} />
                {teams.map((t) => (
                  <div
                    key={`h-${t.id}`}
                    className="flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: t.color,
                      borderRadius: 3,
                      margin: 1,
                    }}
                  >
                    {t.number}
                  </div>
                ))}
              </div>

              {/* Matrix rows */}
              {teams.map((tRow, rowIdx) => (
                <div key={tRow.id} className="flex">
                  {/* Row label */}
                  <div
                    className="flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{
                      width: labelWidth - 2,
                      height: cellSize,
                      backgroundColor: tRow.color,
                      borderRadius: 3,
                      margin: 1,
                    }}
                  >
                    {tRow.number}
                  </div>

                  {/* Cells */}
                  {teams.map((tCol, colIdx) => {
                    const count = matrix[rowIdx][colIdx];
                    const cellKey = `${tRow.id}__${tCol.id}`;
                    const isHovered = hoveredCell === cellKey ||
                      hoveredCell === `${tCol.id}__${tRow.id}`;
                    const isDiagonal = rowIdx === colIdx;

                    return (
                      <Tooltip key={cellKey}>
                        <TooltipTrigger asChild>
                          <div
                            className="shrink-0 flex items-center justify-center text-[9px] font-medium transition-all cursor-default"
                            style={{
                              width: cellSize,
                              height: cellSize,
                              background: getCellColor(count),
                              borderRadius: 3,
                              margin: 1,
                              opacity: isDiagonal ? 0.3 : 1,
                              outline: isHovered ? "2px solid hsl(var(--primary))" : "none",
                              outlineOffset: -1,
                            }}
                            onMouseEnter={() => setHoveredCell(cellKey)}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            {!isDiagonal && count > 0 ? count : ""}
                          </div>
                        </TooltipTrigger>
                        {!isDiagonal && (
                          <TooltipContent side="top" className="text-xs">
                            <span className="font-medium">#{tRow.number} {tRow.name}</span>
                            {" vs "}
                            <span className="font-medium">#{tCol.number} {tCol.name}</span>
                            <br />
                            <span className={count > 1 ? "text-destructive font-bold" : ""}>
                              {count} enfrentamiento{count !== 1 ? "s" : ""}
                            </span>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>
      </ScrollArea>
    </div>
  );
}
