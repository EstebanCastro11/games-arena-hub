import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface TimerState {
  rotationId: string | null;
  startedAt: Date | null;
  durationSeconds: number;
  status: string;
  remainingSeconds: number;
  isActive: boolean;
}

export function useRotationTimer() {
  const [timer, setTimer] = useState<TimerState>({
    rotationId: null,
    startedAt: null,
    durationSeconds: 300,
    status: "inactive",
    remainingSeconds: 0,
    isActive: false,
  });
  const queryClient = useQueryClient();

  const fetchTimer = useCallback(async () => {
    const { data } = await supabase
      .from("rotation_timer")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const started = new Date(data.started_at);
      const elapsed = Math.floor((Date.now() - started.getTime()) / 1000);
      const remaining = Math.max(0, data.duration_seconds - elapsed);

      setTimer({
        rotationId: data.rotation_id,
        startedAt: started,
        durationSeconds: data.duration_seconds,
        status: remaining > 0 ? "active" : "finished",
        remainingSeconds: remaining,
        isActive: remaining > 0,
      });
    } else {
      setTimer(prev => ({ ...prev, isActive: false, status: "inactive", remainingSeconds: 0 }));
    }
  }, []);

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchTimer();

    const channel = supabase
      .channel("rotation-timer")
      .on("postgres_changes", { event: "*", schema: "public", table: "rotation_timer" }, () => {
        fetchTimer();
        queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
        queryClient.invalidateQueries({ queryKey: ["rotations"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTimer, queryClient]);

  // Countdown tick
  useEffect(() => {
    if (!timer.isActive) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        const started = prev.startedAt;
        if (!started) return prev;
        const elapsed = Math.floor((Date.now() - started.getTime()) / 1000);
        const remaining = Math.max(0, prev.durationSeconds - elapsed);
        
        if (remaining <= 0) {
          return { ...prev, remainingSeconds: 0, isActive: false, status: "finished" };
        }
        return { ...prev, remainingSeconds: remaining };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.isActive]);

  return timer;
}

export function useCurrentRotation() {
  const [currentRotation, setCurrentRotation] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("rotations")
        .select("*")
        .eq("status", "in_progress")
        .order("day")
        .order("rotation_number")
        .limit(1)
        .maybeSingle();
      setCurrentRotation(data);
    };
    fetch();

    const channel = supabase
      .channel("current-rotation")
      .on("postgres_changes", { event: "*", schema: "public", table: "rotations" }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return currentRotation;
}

/**
 * Hook that forces a page reload when the rotation_timer changes (new rotation started).
 * Used on non-admin pages (Hub, Captain, Judge) so users always see the latest rotation.
 * Skips the very first event (initial load) to avoid reload on mount.
 */
export function useForceReloadOnRotationChange() {
  const isFirstEvent = useRef(true);

  useEffect(() => {
    const channel = supabase
      .channel("force-reload-rotation")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rotation_timer" }, () => {
        if (isFirstEvent.current) {
          isFirstEvent.current = false;
          return;
        }
        // Force full page reload to get fresh data
        window.location.reload();
      })
      .subscribe();

    // After subscribing, mark first event as consumed after a short delay
    // so that genuine INSERTs (not historical) trigger reload
    const timeout = setTimeout(() => {
      isFirstEvent.current = false;
    }, 3000);

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, []);
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
