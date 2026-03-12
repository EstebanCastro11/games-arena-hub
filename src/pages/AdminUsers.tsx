import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, Gavel, Search, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTeams, useBases } from "@/hooks/useGameData";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  epik_id: string | null;
  phone: string | null;
  created_at: string;
  role?: string;
}

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const { data: teams = [] } = useTeams();
  const { data: bases = [] } = useBases();
  const queryClient = useQueryClient();

  const fetchProfiles = async () => {
    setLoading(true);
    const { data: profilesData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: rolesData } = await supabase.from("user_roles").select("*");

    const merged = (profilesData || []).map(p => ({
      ...p,
      role: rolesData?.find(r => r.user_id === p.user_id)?.role || "sin rol",
    }));

    setProfiles(merged);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const assignRole = async (userId: string, role: "captain" | "judge" | "viewer") => {
    // Delete existing role
    await supabase.from("user_roles").delete().eq("user_id", userId);
    // Insert new role
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      toast.error("Error asignando rol: " + error.message);
      return;
    }
    toast.success(`Rol ${role} asignado`);
    fetchProfiles();
  };

  const assignTeam = async (userId: string, teamId: string) => {
    // Remove from any other team first
    await supabase.from("teams").update({ captain_user_id: null }).eq("captain_user_id", userId);
    // Assign to new team
    const { error } = await supabase.from("teams").update({ captain_user_id: userId }).eq("id", teamId);
    if (error) {
      toast.error("Error asignando equipo: " + error.message);
      return;
    }
    toast.success("Capitán asignado al equipo");
    queryClient.invalidateQueries({ queryKey: ["teams"] });
  };

  const assignBase = async (userId: string, baseId: string) => {
    // Find which day the target base belongs to
    const targetBase = bases.find((b: any) => b.id === baseId);
    const targetDay = targetBase?.day;
    
    // Only remove from bases of the same day
    const sameDayBases = bases.filter((b: any) => b.day === targetDay && b.judge_user_id === userId);
    for (const b of sameDayBases) {
      await supabase.from("bases").update({ judge_user_id: null }).eq("id", (b as any).id);
    }
    
    // Assign to new base
    const { error } = await supabase.from("bases").update({ judge_user_id: userId }).eq("id", baseId);
    if (error) {
      toast.error("Error asignando base: " + error.message);
      return;
    }
    toast.success("Juez asignado a la base");
    queryClient.invalidateQueries({ queryKey: ["bases"] });
  };

  const filtered = profiles.filter(p => {
    const matchSearch = p.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.epik_id || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || p.role === filterRole;
    return matchSearch && matchRole;
  });

  const day1Bases = bases.filter((b: any) => b.day === 1);
  const day2Bases = bases.filter((b: any) => b.day === 2);

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl mb-1">GESTIÓN DE USUARIOS</h1>
        <p className="text-sm text-muted-foreground mb-6">Asigna roles, equipos y bases a los usuarios registrados</p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o ID EPIK..."
              className="w-full bg-card rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="bg-card rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los roles</option>
            <option value="captain">Capitanes</option>
            <option value="judge">Jueces</option>
            <option value="admin">Admins</option>
            <option value="sin rol">Sin rol</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: profiles.length, icon: Users },
            { label: "Capitanes", value: profiles.filter(p => p.role === "captain").length, icon: UserCheck },
            { label: "Jueces", value: profiles.filter(p => p.role === "judge").length, icon: Gavel },
            { label: "Sin rol", value: profiles.filter(p => p.role === "sin rol").length, icon: Users },
          ].map(s => (
            <div key={s.label} className="bg-card card-shadow rounded-xl p-4">
              <s.icon className="w-4 h-4 text-primary mb-1" />
              <div className="font-display text-2xl tabular-nums">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* User List */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Cargando usuarios...</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(profile => {
              const assignedTeam = teams.find((t: any) => t.captain_user_id === profile.user_id);
              const assignedBases = bases.filter((b: any) => b.judge_user_id === profile.user_id);
              const assignedDay1 = assignedBases.find((b: any) => b.day === 1);
              const assignedDay2 = assignedBases.find((b: any) => b.day === 2);

              return (
                <div key={profile.id} className="bg-card card-shadow rounded-xl p-4 border border-border">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{profile.display_name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          profile.role === 'admin' ? 'bg-primary/20 text-primary' :
                          profile.role === 'captain' ? 'bg-accent/20 text-accent' :
                          profile.role === 'judge' ? 'bg-success/20 text-success' :
                          'bg-secondary text-muted-foreground'
                        }`}>{profile.role}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        {profile.epik_id && <span>EPIK: <strong className="text-foreground">{profile.epik_id}</strong></span>}
                        {profile.phone && <span>Tel: {profile.phone}</span>}
                        <span>Registrado: {new Date(profile.created_at).toLocaleDateString('es-CO')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {/* Role assignment */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-10">Rol:</span>
                        <select
                          value={profile.role || ""}
                          onChange={e => assignRole(profile.user_id, e.target.value as any)}
                          className="bg-background rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="captain">Capitán</option>
                          <option value="judge">Juez</option>
                        </select>
                      </div>

                      {/* Captain: assign team */}
                      {profile.role === 'captain' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-10">Equipo:</span>
                          <select
                            value={assignedTeam?.id || ""}
                            onChange={e => assignTeam(profile.user_id, e.target.value)}
                            className="bg-background rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                          >
                            <option value="">Sin asignar</option>
                            {teams.map((t: any) => (
                              <option key={t.id} value={t.id}>#{t.number} {t.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Judge: assign bases day 1 & 2 */}
                      {profile.role === 'judge' && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-10">D1:</span>
                            <select
                              value={assignedDay1?.id || ""}
                              onChange={e => {
                                if (e.target.value) assignBase(profile.user_id, e.target.value);
                              }}
                              className="bg-background rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                            >
                              <option value="">Sin asignar</option>
                              {day1Bases.map((b: any) => (
                                <option key={b.id} value={b.id}>{b.name} {b.location ? `(${b.location})` : ''}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-10">D2:</span>
                            <select
                              value={assignedDay2?.id || ""}
                              onChange={e => {
                                if (e.target.value) assignBase(profile.user_id, e.target.value);
                              }}
                              className="bg-background rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                            >
                              <option value="">Sin asignar</option>
                              {day2Bases.map((b: any) => (
                                <option key={b.id} value={b.id}>{b.name} {b.location ? `(${b.location})` : ''}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No se encontraron usuarios.</p>}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
