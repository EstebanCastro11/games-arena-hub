import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Trophy, LogOut, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useGameData";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BettingEvent {
  id: string;
  title: string;
  status: string;
  winner_team_id: string | null;
}

interface EventTeam {
  event_id: string;
  team_id: string;
}

export default function Betting() {
  const { user, role, displayName, signOut } = useAuth();
  const { data: allTeams = [] } = useTeams();
  const navigate = useNavigate();

  const [activeEvent, setActiveEvent] = useState<BettingEvent | null>(null);
  const [recentEvents, setRecentEvents] = useState<BettingEvent[]>([]);
  const [eventTeams, setEventTeams] = useState<EventTeam[]>([]);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [allBets, setAllBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bet form
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [placing, setPlacing] = useState(false);

  const myTeam = useMemo(() =>
    allTeams.find((t: any) => t.captain_user_id === user?.id) || null
  , [allTeams, user]);

  const fetchData = async () => {
    setLoading(true);
    const [evRes, etRes, betsRes] = await Promise.all([
      supabase.from("betting_events").select("*").order("created_at", { ascending: false }),
      supabase.from("betting_event_teams").select("*"),
      supabase.from("captain_bets").select("*"),
    ]);

    const events = (evRes.data || []) as BettingEvent[];
    setActiveEvent(events.find(e => e.status === "active") || null);
    setRecentEvents(events.filter(e => e.status === "resolved").slice(0, 5));
    setEventTeams((etRes.data || []) as EventTeam[]);
    setAllBets(betsRes.data || []);
    if (user) {
      setMyBets((betsRes.data || []).filter((b: any) => b.placed_by === user.id));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  // Realtime: force reload when betting event changes
  useEffect(() => {
    const channel = supabase.channel("betting-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "betting_events" }, () => {
        // Force reload for fresh state
        window.location.reload();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const competingTeams = useMemo(() => {
    if (!activeEvent) return [];
    return eventTeams
      .filter(et => et.event_id === activeEvent.id)
      .map(et => allTeams.find((t: any) => t.id === et.team_id))
      .filter(Boolean) as any[];
  }, [activeEvent, eventTeams, allTeams]);

  const alreadyBet = useMemo(() =>
    myBets.some(b => b.event_id === activeEvent?.id)
  , [myBets, activeEvent]);

  const eventBetsCount = useMemo(() =>
    activeEvent ? allBets.filter(b => b.event_id === activeEvent.id).length : 0
  , [allBets, activeEvent]);

  const placeBet = async () => {
    if (!activeEvent || !selectedTeamId || !myTeam || !user) return;
    const betAmount = parseInt(amount);
    if (!betAmount || betAmount <= 0) { toast.error("Monto inválido"); return; }
    if (betAmount > (myTeam.betting_balance || 0)) { toast.error("No tienes suficientes créditos"); return; }

    setPlacing(true);
    try {
      // Deduct from balance
      await supabase.from("teams").update({
        betting_balance: myTeam.betting_balance - betAmount,
      }).eq("id", myTeam.id);

      // Place bet
      const { error } = await supabase.from("captain_bets").insert({
        event_id: activeEvent.id,
        team_id: myTeam.id,
        predicted_team_id: selectedTeamId,
        amount: betAmount,
        placed_by: user.id,
      });

      if (error) throw error;
      toast.success("🎰 ¡Apuesta colocada!");
      setSelectedTeamId(null);
      setAmount("");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
    setPlacing(false);
  };

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  const isCaptain = role === "captain" && !!myTeam;

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
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">Hub</Link>
            {user ? (
              <>
                {isCaptain && (
                  <span className="text-xs text-accent font-medium">
                    {myTeam.name} • {myTeam.betting_balance?.toLocaleString()} créditos
                  </span>
                )}
                <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link to="/login" className="gradient-primary px-3 py-1.5 rounded-lg text-xs font-medium text-primary-foreground">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Cargando...</div>
        ) : activeEvent ? (
          <>
            {/* Active Event Banner */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-card card-shadow rounded-2xl p-6 mb-6 glow-primary border-2 border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-destructive live-pulse" />
                <span className="text-xs text-muted-foreground font-medium">APUESTA EN VIVO</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl gradient-text mb-2">{activeEvent.title}</h1>
              <p className="text-sm text-muted-foreground">{eventBetsCount} apuestas colocadas</p>
            </motion.div>

            {/* Competing Teams */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {competingTeams.map((team: any, idx: number) => {
                const isSelected = selectedTeamId === team.id;
                const teamBets = allBets.filter(b => b.event_id === activeEvent.id && b.predicted_team_id === team.id);
                return (
                  <motion.button
                    key={team.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => !alreadyBet && isCaptain && setSelectedTeamId(isSelected ? null : team.id)}
                    disabled={alreadyBet || !isCaptain}
                    className={`relative bg-card card-shadow rounded-xl p-5 text-center transition-all ${
                      isSelected
                        ? "ring-2 ring-primary scale-105 glow-primary"
                        : alreadyBet || !isCaptain
                        ? "opacity-70 cursor-default"
                        : "hover:scale-[1.02] hover:card-shadow-hover cursor-pointer"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-xl font-bold text-white"
                      style={{ backgroundColor: team.color }}>{team.number}</div>
                    <h3 className="font-display text-lg">{team.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-1">{team.faculty}</p>
                    <p className="text-xs text-accent mt-2">{teamBets.length} apuesta{teamBets.length !== 1 ? "s" : ""}</p>
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-xs">✓</span>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Bet Form (Captain only) */}
            {isCaptain && !alreadyBet && selectedTeamId && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card card-shadow rounded-2xl p-6 mb-6">
                <h3 className="font-display text-lg mb-4">COLOCAR APUESTA</h3>
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  Apuestas por: <span className="font-bold text-foreground">
                    {competingTeams.find((t: any) => t.id === selectedTeamId)?.name}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Monto de créditos"
                    min={1}
                    max={myTeam.betting_balance}
                    className="flex-1"
                  />
                  <Button onClick={placeBet} disabled={placing} className="gradient-primary text-primary-foreground">
                    {placing ? "⏳" : "🎰 Apostar"}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Balance disponible: {myTeam.betting_balance?.toLocaleString()} créditos
                </p>
              </motion.div>
            )}

            {/* Already bet message */}
            {isCaptain && alreadyBet && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-success/10 border border-success/30 rounded-xl p-4 mb-6 text-center">
                <p className="text-success font-medium">✅ Ya colocaste tu apuesta para este evento</p>
                {(() => {
                  const myBet = myBets.find(b => b.event_id === activeEvent.id);
                  const predicted = allTeams.find((t: any) => t.id === myBet?.predicted_team_id) as any;
                  return myBet && predicted ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      Apostaste {myBet.amount.toLocaleString()} créditos por <strong>{predicted.name}</strong>
                    </p>
                  ) : null;
                })()}
              </motion.div>
            )}

            {/* Not captain message */}
            {!isCaptain && (
              <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {!user ? "Inicia sesión como capitán para apostar" : "Solo los capitanes con equipo asignado pueden apostar"}
                </p>
              </div>
            )}
          </>
        ) : (
          /* No active event */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20">
            <DollarSign className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display text-2xl text-muted-foreground mb-2">NO HAY APUESTAS ACTIVAS</h2>
            <p className="text-sm text-muted-foreground">El administrador aún no ha activado una ronda de apuestas.</p>
          </motion.div>
        )}

        {/* Recent resolved events */}
        {recentEvents.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-xl mb-4 text-muted-foreground">RESULTADOS ANTERIORES</h2>
            <div className="space-y-3">
              {recentEvents.map(ev => {
                const evTeamIds = eventTeams.filter(et => et.event_id === ev.id).map(et => et.team_id);
                const winner = allTeams.find((t: any) => t.id === ev.winner_team_id) as any;
                return (
                  <div key={ev.id} className="bg-card card-shadow rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-display text-base">{ev.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {winner && (
                            <span className="text-xs text-success flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> {winner.name} ganó
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success">Resuelta</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
