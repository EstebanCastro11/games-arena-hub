import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, MapPin, Play, SkipForward, Timer } from "lucide-react";
import { useRotations, useAllMatchupsWithDetails } from "@/hooks/useGameData";
import { useRotationTimer, useCurrentRotation, formatTime } from "@/hooks/useRotationTimer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";

export default function AdminRotations() {
  const { data: rotations = [] } = useRotations();
  const { data: allMatchups = [] } = useAllMatchupsWithDetails();
  const timer = useRotationTimer();
  const currentRotation = useCurrentRotation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartRotation = async () => {
    if (!currentRotation) {
      // Find first pending rotation and set it to in_progress
      const firstPending = rotations.find((r: any) => r.status === 'pending');
      if (!firstPending) {
        toast.error("No hay rotaciones pendientes");
        return;
      }
      setIsStarting(true);
      await supabase.from("rotations").update({ status: "in_progress" }).eq("id", firstPending.id);
      await supabase.from("matchups").update({ status: "in_progress" }).eq("rotation_id", firstPending.id);
      // Start timer
      await supabase.from("rotation_timer").update({ status: "expired" }).eq("status", "active");
      await supabase.from("rotation_timer").insert({
        rotation_id: firstPending.id,
        duration_seconds: 300,
        status: "active",
        created_by: user?.id,
      });
      queryClient.invalidateQueries({ queryKey: ["rotations"] });
      queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
      toast.success(`¡Rotación ${firstPending.rotation_number} iniciada! Contador de 5 minutos activado.`);
      setIsStarting(false);
      return;
    }

    // Advance: complete current, start next
    setIsStarting(true);

    // Complete current rotation
    await supabase.from("rotations").update({ status: "completed" }).eq("id", currentRotation.id);
    await supabase.from("matchups").update({ status: "completed" }).eq("rotation_id", currentRotation.id);

    // Expire old timer
    await supabase.from("rotation_timer").update({ status: "expired" }).eq("status", "active");

    // Find next pending rotation (same day first, then next day)
    const nextRotation = rotations
      .filter((r: any) => r.status === 'pending')
      .sort((a: any, b: any) => a.day - b.day || a.rotation_number - b.rotation_number)[0];

    if (nextRotation) {
      await supabase.from("rotations").update({ status: "in_progress" }).eq("id", nextRotation.id);
      await supabase.from("matchups").update({ status: "in_progress" }).eq("rotation_id", nextRotation.id);
      
      // Start new timer
      await supabase.from("rotation_timer").insert({
        rotation_id: nextRotation.id,
        duration_seconds: 300,
        status: "active",
        created_by: user?.id,
      });
      
      toast.success(`¡Rotación ${nextRotation.rotation_number} (Día ${nextRotation.day}) iniciada!`);
    } else {
      toast.info("¡Todas las rotaciones han sido completadas!");
    }

    queryClient.invalidateQueries({ queryKey: ["rotations"] });
    queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
    setIsStarting(false);
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl">ROTACIONES</h1>
            <p className="text-sm text-muted-foreground">Programación de equipos por rondas y bases</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer display */}
            {timer.isActive && (
              <div className="bg-card card-shadow rounded-xl px-4 py-2 flex items-center gap-3">
                <Timer className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-[10px] text-muted-foreground">Tiempo restante</div>
                  <div className={`font-display text-2xl tabular-nums ${
                    timer.remainingSeconds <= 60 ? 'text-destructive' : 'text-foreground'
                  }`}>
                    {formatTime(timer.remainingSeconds)}
                  </div>
                </div>
              </div>
            )}

            {/* Rotation control button */}
            <button
              onClick={handleStartRotation}
              disabled={isStarting}
              className="gradient-primary px-6 py-3 rounded-xl font-medium text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-2 disabled:opacity-70"
            >
              {isStarting ? (
                <span className="animate-spin">⏳</span>
              ) : currentRotation ? (
                <><SkipForward className="w-4 h-4" /> Siguiente Rotación</>
              ) : (
                <><Play className="w-4 h-4" /> Iniciar Rotación</>
              )}
            </button>
          </div>
        </div>

        {/* Current rotation highlight */}
        {currentRotation && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card card-shadow rounded-2xl p-6 mb-6 glow-primary border-2 border-primary/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-destructive live-pulse" />
              <h3 className="font-display text-2xl gradient-text">
                EN VIVO: DÍA {currentRotation.day} — ROTACIÓN {currentRotation.rotation_number}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {allMatchups.filter((m: any) => m.rotation_id === currentRotation.id).length} enfrentamientos activos
              {timer.isActive && ` • ${formatTime(timer.remainingSeconds)} restantes`}
            </p>
          </motion.div>
        )}

        <div className="space-y-6">
          {rotations
            .sort((a: any, b: any) => a.day - b.day || a.rotation_number - b.rotation_number)
            .map((rotation: any) => {
              const rotMatchups = allMatchups.filter((m: any) => m.rotation_id === rotation.id);
              const isCurrent = currentRotation?.id === rotation.id;
              return (
                <motion.div key={rotation.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`bg-card card-shadow rounded-xl p-5 ${isCurrent ? 'ring-2 ring-primary/50' : ''}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-primary-foreground ${
                      isCurrent ? 'gradient-primary' : rotation.status === 'completed' ? 'bg-success' : 'bg-secondary text-muted-foreground'
                    }`}>
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
                    {rotMatchups.map((match: any) => {
                      const resultData = Array.isArray(match.result) ? match.result[0] : match.result;
                      const hasResult = !!resultData;
                      return (
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
                          {hasResult && (
                            <div className="mt-2 text-[10px] text-center">
                              <span className="text-success font-medium">
                                {resultData.result === 'team_a' ? `${match.team_a?.name} ganó` :
                                 resultData.result === 'team_b' ? `${match.team_b?.name} ganó` : 'Empate'}
                              </span>
                              <span className="text-muted-foreground ml-1">
                                ({resultData.team_a_points} - {resultData.team_b_points})
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
        </div>
      </div>
    </AdminLayout>
  );
}
