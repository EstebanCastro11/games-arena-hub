import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("total_points", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useBases(day?: number) {
  return useQuery({
    queryKey: ["bases", day],
    queryFn: async () => {
      let query = supabase.from("bases").select("*").order("order_index");
      if (day) query = query.eq("day", day);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useRotations(day?: number) {
  return useQuery({
    queryKey: ["rotations", day],
    queryFn: async () => {
      let query = supabase.from("rotations").select("*").order("rotation_number");
      if (day) query = query.eq("day", day);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useMatchups(rotationId?: string) {
  return useQuery({
    queryKey: ["matchups", rotationId],
    queryFn: async () => {
      let query = supabase
        .from("matchups")
        .select(`
          *,
          base:bases(*),
          team_a:teams!matchups_team_a_id_fkey(*),
          team_b:teams!matchups_team_b_id_fkey(*),
          rotation:rotations(*),
          result:match_results(*)
        `);
      if (rotationId) query = query.eq("rotation_id", rotationId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("status", "active")
        .order("total_points", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllMatchupsWithDetails() {
  return useQuery({
    queryKey: ["all-matchups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matchups")
        .select(`
          *,
          base:bases(name, base_type, location, day),
          team_a:teams!matchups_team_a_id_fkey(id, name, number, color),
          team_b:teams!matchups_team_b_id_fkey(id, name, number, color),
          rotation:rotations(day, rotation_number, status),
          result:match_results(*)
        `)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [teams, bases, matchups, results, rotations, announcements, bets] = await Promise.all([
        supabase.from("teams").select("id", { count: "exact", head: true }),
        supabase.from("bases").select("id", { count: "exact", head: true }),
        supabase.from("matchups").select("id, status"),
        supabase.from("match_results").select("id", { count: "exact", head: true }),
        supabase.from("rotations").select("*"),
        supabase.from("announcements").select("id", { count: "exact", head: true }),
        supabase.from("bets").select("id", { count: "exact", head: true }),
      ]);

      const matchupData = matchups.data || [];
      return {
        totalTeams: teams.count || 0,
        totalBases: bases.count || 0,
        totalMatchups: matchupData.length,
        completedMatchups: matchupData.filter(m => m.status === 'completed').length,
        inProgressMatchups: matchupData.filter(m => m.status === 'in_progress').length,
        pendingMatchups: matchupData.filter(m => m.status === 'pending').length,
        totalResults: results.count || 0,
        rotations: rotations.data || [],
        totalAnnouncements: announcements.count || 0,
        totalBets: bets.count || 0,
      };
    },
  });
}
