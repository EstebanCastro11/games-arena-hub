import { useState } from "react";
import { motion } from "framer-motion";
import { Swords, Pencil, Trash2, Filter } from "lucide-react";
import { useAllMatchupsWithDetails, useRotations, useTeams, useBases } from "@/hooks/useGameData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminMatchups() {
  const { data: allMatchups = [], isLoading } = useAllMatchupsWithDetails();
  const { data: rotations = [] } = useRotations();
  const { data: teams = [] } = useTeams();
  const { data: bases = [] } = useBases();
  const queryClient = useQueryClient();

  const [rotationFilter, setRotationFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ team_a_id: "", team_b_id: "", base_id: "", rotation_id: "", status: "pending" });
  const [saving, setSaving] = useState(false);

  const filtered = rotationFilter === "all" ? allMatchups : allMatchups.filter((m: any) => m.rotation_id === rotationFilter);

  const openEdit = (match: any) => {
    setEditingId(match.id);
    setForm({ team_a_id: match.team_a_id, team_b_id: match.team_b_id, base_id: match.base_id, rotation_id: match.rotation_id, status: match.status });
    setDialogOpen(true);
  };
  const openDelete = (match: any) => { setEditingId(match.id); setDeleteOpen(true); };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("matchups").update({
        team_a_id: form.team_a_id, team_b_id: form.team_b_id,
        base_id: form.base_id, rotation_id: form.rotation_id, status: form.status,
      }).eq("id", editingId);
      if (error) throw error;
      toast.success("Enfrentamiento actualizado");
      queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      const { error } = await supabase.from("matchups").delete().eq("id", editingId);
      if (error) throw error;
      toast.success("Enfrentamiento eliminado");
      queryClient.invalidateQueries({ queryKey: ["all-matchups"] });
    } catch (e: any) { toast.error(e.message); }
    setDeleteOpen(false);
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl">ENFRENTAMIENTOS</h1>
            <p className="text-sm text-muted-foreground">{allMatchups.length} enfrentamientos en {rotations.length} rotaciones</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={rotationFilter} onValueChange={setRotationFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar rotación" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las rotaciones</SelectItem>
              {rotations.map((r: any) => (
                <SelectItem key={r.id} value={r.id}>Día {r.day} - Rotación {r.rotation_number}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((match: any, idx: number) => (
              <motion.div key={match.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }} className="bg-card card-shadow rounded-xl p-4 hover:card-shadow-hover transition-shadow group">
                <div className="flex items-center gap-4">
                  <div className="w-16 text-center shrink-0">
                    <span className="text-[10px] text-muted-foreground block">D{match.rotation?.day} R{match.rotation?.rotation_number}</span>
                    <span className="text-xs text-muted-foreground">{match.base?.name}</span>
                    {match.base?.base_type === 'macro' && <span className="block text-[9px] text-accent">MACRO</span>}
                  </div>

                  <div className="flex-1 flex items-center gap-3 justify-end">
                    <span className="font-medium text-sm text-right hidden sm:block">{match.team_a?.name}</span>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: match.team_a?.color, color: '#fff' }}>{match.team_a?.number}</div>
                  </div>

                  <div className="flex flex-col items-center px-2">
                    <Swords className="w-4 h-4 text-primary mb-1" />
                    <span className="font-display text-xs text-muted-foreground">VS</span>
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: match.team_b?.color, color: '#fff' }}>{match.team_b?.number}</div>
                    <span className="font-medium text-sm hidden sm:block">{match.team_b?.name}</span>
                  </div>

                  <div className="w-24 text-right shrink-0">
                    {match.result && match.result.length > 0 ? (
                      <div>
                        <span className="text-xs text-success font-medium">
                          {match.result[0].result === 'team_a' ? match.team_a?.name :
                           match.result[0].result === 'team_b' ? match.team_b?.name : 'Empate'}
                        </span>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {match.result[0].team_a_points}-{match.result[0].team_b_points}
                        </div>
                      </div>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        match.status === 'in_progress' ? 'bg-accent/20 text-accent' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {match.status === 'in_progress' ? 'En Vivo' : 'Pendiente'}
                      </span>
                    )}
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                    <button onClick={() => openEdit(match)} className="p-1.5 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openDelete(match)} className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Editar Enfrentamiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Equipo A</Label>
              <Select value={form.team_a_id} onValueChange={v => setForm({ ...form, team_a_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {teams.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>#{t.number} {t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Equipo B</Label>
              <Select value={form.team_b_id} onValueChange={v => setForm({ ...form, team_b_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {teams.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>#{t.number} {t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base</Label>
                <Select value={form.base_id} onValueChange={v => setForm({ ...form, base_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {bases.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rotación</Label>
              <Select value={form.rotation_id} onValueChange={v => setForm({ ...form, rotation_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {rotations.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>Día {r.day} - Rotación {r.rotation_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar enfrentamiento?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción eliminará el enfrentamiento y sus resultados asociados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
