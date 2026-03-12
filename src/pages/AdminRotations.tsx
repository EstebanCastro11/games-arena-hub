import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, MapPin, Play, SkipForward, SkipBack, RotateCcw, Timer } from "lucide-react";
import { useRotations, useAllMatchupsWithDetails } from "@/hooks/useGameData";
import { useRotationTimer, useCurrentRotation, formatTime } from "@/hooks/useRotationTimer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function AdminRotations() {
  const { data: rotations = [] } = useRotations();
  const { data: allMatchups = [] } = useAllMatchupsWithDetails();
  const timer = useRotationTimer();
  const currentRotation = useCurrentRotation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [fullResetConfirmOpen, setFullResetConfirmOpen] = useState(false);
  const [isFullResetting, setIsFullResetting] = useState(false);

  const sortedRotations = [...rotations].sort((a: any, b: any) => a.day - b.day || a.rotation_number - b.rotation_number);

  const activateRotation = async (rotation: any) => {
    setIsStarting(true);
    try {
      // Complete any current in_progress rotation
      await supabase.from("rotations").update({ status: "completed" }).eq("status", "in_progress");
      await supabase.from("matchups").update({ status: "completed" }).in("rotation_id",
        sortedRotations.filter((r: any) => r.status === "in_progress").map((r: any) => r.id)
      );

      // Expire old timer
      await supabase.from("rotation_timer").update({ status: "expired" }).eq("status", "active");

      // Activate chosen rotation
      await supabase.from("rotations").update({ status: "in_progress" }).eq("id", rotation.id);
      await supabase.from("matchups").update({ status: "in_progress" }).eq("rotation_id", rotation.id);

      // Start new timer
      await supabase.from("rotation_timer").insert({
        rotation_id: rotation.id,
        duration_seconds: 300,
        status: "active",
        created_by: user?.id,
      });

      queryClient.invalidateQueries({ queryKey: ["rotations"] });
      queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
      toast.success(`¡Rotación ${rotation.rotation_number} (Día ${rotation.day}) iniciada!`);
    } catch (e: any) {
      toast.error(e.message);
    }
    setIsStarting(false);
  };

  const handleStartFromFirst = () => {
    if (sortedRotations.length === 0) { toast.error("No hay rotaciones"); return; }
    setResetConfirmOpen(true);
  };

  const confirmStartFromFirst = async () => {
    setResetConfirmOpen(false);
    // Reset all rotations to pending first
    await supabase.from("rotations").update({ status: "pending" }).neq("status", "pending");
    await supabase.from("matchups").update({ status: "pending" }).neq("status", "pending");
    await supabase.from("rotation_timer").update({ status: "expired" }).eq("status", "active");
    // Delete all results and reset team scores
    await supabase.from("match_results").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("teams").update({
      total_points: 0, wins: 0, losses: 0, draws: 0, matches_played: 0,
    }).neq("id", "00000000-0000-0000-0000-000000000000");
    queryClient.invalidateQueries({ queryKey: ["rotations"] });
    queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
    queryClient.invalidateQueries({ queryKey: ["teams"] });
    // Small delay to let state settle
    setTimeout(() => activateRotation(sortedRotations[0]), 300);
  };

  const handleNextRotation = () => {
    if (!currentRotation) {
      // No active rotation, start the first pending
      const firstPending = sortedRotations.find((r: any) => r.status === 'pending');
      if (firstPending) activateRotation(firstPending);
      else toast.error("No hay rotaciones pendientes");
      return;
    }
    const currentIdx = sortedRotations.findIndex((r: any) => r.id === currentRotation.id);
    if (currentIdx < sortedRotations.length - 1) {
      activateRotation(sortedRotations[currentIdx + 1]);
    } else {
      toast.info("Esta es la última rotación");
    }
  };

  const handlePreviousRotation = () => {
    if (!currentRotation) { toast.error("No hay rotación activa"); return; }
    const currentIdx = sortedRotations.findIndex((r: any) => r.id === currentRotation.id);
    if (currentIdx > 0) {
      // Set current back to pending
      activateRotation(sortedRotations[currentIdx - 1]);
    } else {
      toast.info("Esta es la primera rotación");
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl">ROTACIONES</h1>
            <p className="text-sm text-muted-foreground">Programación de equipos por rondas y bases</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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
          </div>
        </div>

        {/* Rotation Control Panel */}
        <div className="bg-card card-shadow rounded-2xl p-5 mb-6">
          <h3 className="font-display text-lg mb-4 text-muted-foreground">CONTROLES DE ROTACIÓN</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setFullResetConfirmOpen(true)} disabled={isStarting || isFullResetting} variant="destructive" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Reiniciar Todo desde 0
            </Button>
            <Button onClick={handleStartFromFirst} disabled={isStarting} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Empezar desde Rotación 1
            </Button>
            <Button onClick={handlePreviousRotation} disabled={isStarting || !currentRotation} variant="outline" className="flex items-center gap-2">
              <SkipBack className="w-4 h-4" /> Rotación Anterior
            </Button>
            <Button onClick={handleNextRotation} disabled={isStarting} className="gradient-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-2">
              {isStarting ? (
                <span className="animate-spin">⏳</span>
              ) : currentRotation ? (
                <><SkipForward className="w-4 h-4" /> Siguiente Rotación</>
              ) : (
                <><Play className="w-4 h-4" /> Iniciar Rotación</>
              )}
            </Button>
          </div>
          {currentRotation && (
            <p className="text-sm text-muted-foreground mt-3">
              Rotación activa: <span className="text-foreground font-medium">Día {currentRotation.day} — Ronda {currentRotation.rotation_number}</span>
            </p>
          )}
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
          {sortedRotations.map((rotation: any) => {
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
                  <div className="ml-auto flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rotation.status === 'completed' ? 'bg-success/20 text-success' :
                      rotation.status === 'in_progress' ? 'bg-accent/20 text-accent live-pulse' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {rotation.status === 'completed' ? '✓ Completa' : rotation.status === 'in_progress' ? '● En Vivo' : 'Pendiente'}
                    </span>
                    {!isCurrent && (
                      <Button size="sm" variant="ghost" onClick={() => activateRotation(rotation)} disabled={isStarting} className="text-xs">
                        <Play className="w-3 h-3 mr-1" /> Activar
                      </Button>
                    )}
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

      {/* Reset Confirm Dialog */}
      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reiniciar desde Rotación 1?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto reseteará todas las rotaciones a "Pendiente" y comenzará desde la primera rotación. Los resultados existentes no se borran.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStartFromFirst}>Reiniciar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Full Reset Dialog */}
      <AlertDialog open={fullResetConfirmOpen} onOpenChange={setFullResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ ¿Reiniciar TODO desde cero?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto borrará TODOS los resultados, pondrá TODOS los equipos en 0 puntos, reseteará todas las rotaciones a pendiente y detendrá el timer. Esta acción NO se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setFullResetConfirmOpen(false);
              setIsFullResetting(true);
              try {
                // 1. Delete all match results
                await supabase.from("match_results").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                // 2. Reset all teams to 0
                await supabase.from("teams").update({
                  total_points: 0, wins: 0, losses: 0, draws: 0, matches_played: 0,
                }).neq("id", "00000000-0000-0000-0000-000000000000");
                // 3. Reset rotations & matchups
                await supabase.from("rotations").update({ status: "pending" }).neq("status", "pending");
                await supabase.from("matchups").update({ status: "pending" }).neq("status", "pending");
                // 4. Expire timers
                await supabase.from("rotation_timer").update({ status: "expired" }).eq("status", "active");
                
                queryClient.invalidateQueries({ queryKey: ["rotations"] });
                queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
                queryClient.invalidateQueries({ queryKey: ["teams"] });
                toast.success("✅ Todo reiniciado a 0. Listo para empezar de nuevo.");
              } catch (e: any) {
                toast.error(e.message);
              }
              setIsFullResetting(false);
            }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sí, reiniciar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
