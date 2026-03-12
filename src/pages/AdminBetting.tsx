import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, Play, Square, Trophy, Plus, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTeams } from "@/hooks/useGameData";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BettingEvent {
  id: string;
  title: string;
  status: string;
  winner_team_id: string | null;
  created_at: string;
  activated_at: string | null;
  closed_at: string | null;
}

interface EventTeam {
  id: string;
  event_id: string;
  team_id: string;
}

interface CaptainBet {
  id: string;
  event_id: string;
  team_id: string;
  predicted_team_id: string;
  amount: number;
  status: string;
  placed_by: string;
}

export default function AdminBetting() {
  const { user } = useAuth();
  const { data: teams = [] } = useTeams();
  const queryClient = useQueryClient();

  const [events, setEvents] = useState<BettingEvent[]>([]);
  const [eventTeams, setEventTeams] = useState<EventTeam[]>([]);
  const [bets, setBets] = useState<CaptainBet[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [title, setTitle] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // Resolve
  const [resolveEventId, setResolveEventId] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    const [evRes, etRes, betsRes] = await Promise.all([
      supabase.from("betting_events").select("*").order("created_at", { ascending: false }),
      supabase.from("betting_event_teams").select("*"),
      supabase.from("captain_bets").select("*"),
    ]);
    setEvents((evRes.data || []) as BettingEvent[]);
    setEventTeams((etRes.data || []) as EventTeam[]);
    setBets((betsRes.data || []) as CaptainBet[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase.channel("admin-betting")
      .on("postgres_changes", { event: "*", schema: "public", table: "captain_bets" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prev =>
      prev.includes(teamId) ? prev.filter(t => t !== teamId) : [...prev, teamId]
    );
  };

  const createEvent = async () => {
    if (!title.trim()) { toast.error("Escribe un título"); return; }
    if (selectedTeams.length < 2) { toast.error("Selecciona al menos 2 equipos"); return; }

    const { data: ev, error } = await supabase.from("betting_events").insert({
      title: title.trim(),
      status: "draft",
      created_by: user?.id,
    }).select().single();

    if (error || !ev) { toast.error(error?.message || "Error"); return; }

    const teamInserts = selectedTeams.map(tid => ({ event_id: ev.id, team_id: tid }));
    await supabase.from("betting_event_teams").insert(teamInserts);

    setTitle("");
    setSelectedTeams([]);
    toast.success("Evento de apuesta creado");
    fetchAll();
  };

  const activateEvent = async (eventId: string) => {
    // Close any other active event first
    await supabase.from("betting_events").update({ status: "closed", closed_at: new Date().toISOString() }).eq("status", "active");
    // Activate this one
    await supabase.from("betting_events").update({ status: "active", activated_at: new Date().toISOString() }).eq("id", eventId);
    toast.success("🎰 ¡Apuestas activadas! Los capitanes ya pueden apostar");
    fetchAll();
  };

  const closeEvent = async (eventId: string) => {
    await supabase.from("betting_events").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", eventId);
    toast.success("Apuestas cerradas");
    fetchAll();
  };

  const resolveEvent = async () => {
    if (!resolveEventId || !winnerId) return;

    // Update event
    await supabase.from("betting_events").update({
      status: "resolved",
      winner_team_id: winnerId,
      resolved_at: new Date().toISOString(),
    }).eq("id", resolveEventId);

    // Update bets
    const eventBets = bets.filter(b => b.event_id === resolveEventId);
    const winners = eventBets.filter(b => b.predicted_team_id === winnerId);
    const losers = eventBets.filter(b => b.predicted_team_id !== winnerId);

    // Total pool from losers
    const lostPool = losers.reduce((sum, b) => sum + b.amount, 0);
    const totalWinnerAmount = winners.reduce((sum, b) => sum + b.amount, 0);

    for (const bet of winners) {
      // Proportional payout from losers' pool + original bet back
      const share = totalWinnerAmount > 0 ? Math.floor(lostPool * (bet.amount / totalWinnerAmount)) : 0;
      const payout = bet.amount + share;
      await supabase.from("captain_bets").update({ status: "won", payout }).eq("id", bet.id);
      // Add payout to team's betting balance
      await supabase.from("teams").update({
        betting_balance: (teams.find(t => t.id === bet.team_id)?.betting_balance || 0) + payout,
      }).eq("id", bet.team_id);
    }

    for (const bet of losers) {
      await supabase.from("captain_bets").update({ status: "lost", payout: 0 }).eq("id", bet.id);
    }

    setResolveEventId(null);
    setWinnerId("");
    toast.success("✅ Apuesta resuelta. Créditos distribuidos.");
    fetchAll();
    queryClient.invalidateQueries({ queryKey: ["teams"] });
  };

  const deleteEvent = async (eventId: string) => {
    await supabase.from("betting_events").delete().eq("id", eventId);
    toast.success("Evento eliminado");
    fetchAll();
  };

  const activeEvent = events.find(e => e.status === "active");

  const statusLabel = (s: string) => {
    switch (s) {
      case "draft": return { text: "Borrador", class: "bg-secondary text-muted-foreground" };
      case "active": return { text: "🔴 EN VIVO", class: "bg-destructive/20 text-destructive" };
      case "closed": return { text: "Cerrada", class: "bg-accent/20 text-accent" };
      case "resolved": return { text: "✓ Resuelta", class: "bg-success/20 text-success" };
      default: return { text: s, class: "bg-secondary text-muted-foreground" };
    }
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="font-display text-3xl mb-1">SISTEMA DE APUESTAS</h1>
        <p className="text-sm text-muted-foreground mb-6">Crea y gestiona eventos de apuestas entre equipos</p>

        {/* Active event banner */}
        {activeEvent && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card card-shadow rounded-2xl p-5 mb-6 glow-primary border-2 border-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-destructive live-pulse" />
                  <span className="text-xs text-muted-foreground">APUESTA ACTIVA</span>
                </div>
                <h2 className="font-display text-2xl gradient-text">{activeEvent.title}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {bets.filter(b => b.event_id === activeEvent.id).length} apuestas recibidas
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => closeEvent(activeEvent.id)}>
                  <Square className="w-3 h-3 mr-1" /> Cerrar Apuestas
                </Button>
                <Button size="sm" onClick={() => { setResolveEventId(activeEvent.id); setWinnerId(""); }}>
                  <Trophy className="w-3 h-3 mr-1" /> Declarar Ganador
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Create new event */}
        <div className="bg-card card-shadow rounded-2xl p-5 mb-6">
          <h3 className="font-display text-lg mb-4 text-muted-foreground">CREAR NUEVA APUESTA</h3>
          <div className="space-y-4">
            <div>
              <Label>Título del evento</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Equipo 1 vs Equipo 5 vs Equipo 12" className="mt-1" />
            </div>
            <div>
              <Label className="mb-2 block">Equipos que compiten (selecciona 2+)</Label>
              <div className="flex flex-wrap gap-2">
                {teams.map((t: any) => {
                  const isSelected = selectedTeams.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTeam(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-2 ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground scale-105"
                          : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ backgroundColor: t.color }}>{t.number}</div>
                      {t.name}
                    </button>
                  );
                })}
              </div>
              {selectedTeams.length > 0 && (
                <p className="text-xs text-primary mt-2">{selectedTeams.length} equipos seleccionados</p>
              )}
            </div>
            <Button onClick={createEvent} disabled={!title.trim() || selectedTeams.length < 2}>
              <Plus className="w-4 h-4 mr-1" /> Crear Evento de Apuesta
            </Button>
          </div>
        </div>

        {/* Events list */}
        <h3 className="font-display text-lg mb-4 text-muted-foreground">HISTORIAL DE APUESTAS</h3>
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Cargando...</p>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay eventos de apuestas aún.</p>
        ) : (
          <div className="space-y-3">
            {events.map(ev => {
              const evTeams = eventTeams.filter(et => et.event_id === ev.id);
              const evBets = bets.filter(b => b.event_id === ev.id);
              const totalPool = evBets.reduce((s, b) => s + b.amount, 0);
              const st = statusLabel(ev.status);
              const winnerTeam = ev.winner_team_id ? teams.find((t: any) => t.id === ev.winner_team_id) : null;

              return (
                <motion.div key={ev.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card card-shadow rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-display text-lg">{ev.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.class}`}>{st.text}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(ev.created_at).toLocaleDateString("es-CO")} • {evBets.length} apuestas • Pool: {totalPool.toLocaleString()} créditos
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {ev.status === "draft" && (
                        <>
                          <Button size="sm" onClick={() => activateEvent(ev.id)} className="gradient-primary text-primary-foreground">
                            <Play className="w-3 h-3 mr-1" /> Activar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteEvent(ev.id)} className="text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      {ev.status === "closed" && (
                        <Button size="sm" onClick={() => { setResolveEventId(ev.id); setWinnerId(""); }}>
                          <Trophy className="w-3 h-3 mr-1" /> Resolver
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Competing teams */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {evTeams.map(et => {
                      const t = teams.find((tm: any) => tm.id === et.team_id) as any;
                      if (!t) return null;
                      const isWinner = ev.winner_team_id === t.id;
                      return (
                        <div key={et.id} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                          isWinner ? "bg-success/20 border border-success/40" : "bg-secondary/50"
                        }`}>
                          <div className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white"
                            style={{ backgroundColor: t.color }}>{t.number}</div>
                          <span className={isWinner ? "font-bold text-success" : "text-muted-foreground"}>{t.name}</span>
                          {isWinner && <Trophy className="w-3 h-3 text-success" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bets breakdown */}
                  {evBets.length > 0 && (
                    <div className="mt-2 border-t border-border pt-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                        {evBets.map(bet => {
                          const bettingTeam = teams.find((t: any) => t.id === bet.team_id) as any;
                          const predictedTeam = teams.find((t: any) => t.id === bet.predicted_team_id) as any;
                          return (
                            <div key={bet.id} className={`text-[10px] px-2 py-1.5 rounded-lg ${
                              bet.status === "won" ? "bg-success/10" : bet.status === "lost" ? "bg-destructive/10" : "bg-secondary/30"
                            }`}>
                              <span className="font-medium">{bettingTeam?.name}</span>
                              <span className="text-muted-foreground"> → {predictedTeam?.name}</span>
                              <span className="block text-muted-foreground">{bet.amount.toLocaleString()} créditos</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolve Dialog */}
      <AlertDialog open={!!resolveEventId} onOpenChange={() => setResolveEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Declarar Ganador</AlertDialogTitle>
            <AlertDialogDescription>
              Selecciona el equipo ganador. Los capitanes que acertaron recibirán los créditos de los perdedores proporcionalmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={winnerId} onValueChange={setWinnerId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar ganador" /></SelectTrigger>
              <SelectContent>
                {eventTeams.filter(et => et.event_id === resolveEventId).map(et => {
                  const t = teams.find((tm: any) => tm.id === et.team_id) as any;
                  if (!t) return null;
                  return <SelectItem key={t.id} value={t.id}>#{t.number} {t.name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={resolveEvent} disabled={!winnerId}>Resolver Apuesta</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
