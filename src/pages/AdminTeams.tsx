import { useState } from "react";
import { motion } from "framer-motion";
import { Search, LayoutGrid, List, Plus, Users as UsersIcon, Pencil, Trash2, X } from "lucide-react";
import { useTeams } from "@/hooks/useGameData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ViewMode = "cards" | "table";

type TeamForm = {
  name: string;
  number: number;
  faculty: string;
  color: string;
  status: string;
  members_count: number;
};

const emptyForm: TeamForm = { name: "", number: 0, faculty: "", color: "#6366f1", status: "active", members_count: 5 };

export default function AdminTeams() {
  const [view, setView] = useState<ViewMode>("cards");
  const [search, setSearch] = useState("");
  const { data: teams = [], isLoading } = useTeams();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TeamForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.faculty || '').toLowerCase().includes(search.toLowerCase()) ||
    t.number.toString().includes(search)
  );

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (team: any) => {
    setEditingId(team.id);
    setForm({ name: team.name, number: team.number, faculty: team.faculty || "", color: team.color, status: team.status, members_count: team.members_count });
    setDialogOpen(true);
  };
  const openDelete = (team: any) => { setEditingId(team.id); setDeleteOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase.from("teams").update({
          name: form.name, number: form.number, faculty: form.faculty || null,
          color: form.color, status: form.status, members_count: form.members_count,
        }).eq("id", editingId);
        if (error) throw error;
        toast.success("Equipo actualizado");
      } else {
        const { error } = await supabase.from("teams").insert({
          name: form.name, number: form.number, faculty: form.faculty || null,
          color: form.color, status: form.status, members_count: form.members_count,
        });
        if (error) throw error;
        toast.success("Equipo creado");
      }
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      const { error } = await supabase.from("teams").delete().eq("id", editingId);
      if (error) throw error;
      toast.success("Equipo eliminado");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    } catch (e: any) { toast.error(e.message); }
    setDeleteOpen(false);
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl">EQUIPOS</h1>
            <p className="text-sm text-muted-foreground">{teams.length} equipos registrados</p>
          </div>
          <Button onClick={openCreate} className="gradient-primary text-primary-foreground self-start">
            <Plus className="w-4 h-4" /> Nuevo Equipo
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar equipo..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card card-shadow rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background" />
          </div>
          <div className="flex bg-card card-shadow rounded-lg p-1">
            <button onClick={() => setView("cards")} className={`p-2 rounded-md transition-colors ${view === 'cards' ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("table")} className={`p-2 rounded-md transition-colors ${view === 'table' ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando equipos...</div>
        ) : view === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((team, idx) => (
              <motion.div key={team.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                className="bg-card card-shadow rounded-xl p-5 hover:card-shadow-hover transition-shadow group relative">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => openEdit(team)} className="p-1.5 rounded-lg bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openDelete(team)} className="p-1.5 rounded-lg bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border-2 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: team.color, borderColor: `${team.color}60`, color: '#fff' }}>{team.number}</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    team.status === 'active' ? 'bg-success/20 text-success' : team.status === 'disqualified' ? 'bg-destructive/20 text-destructive' : 'bg-secondary text-muted-foreground'
                  }`}>{team.status === 'active' ? 'Activo' : team.status === 'disqualified' ? 'Descalificado' : 'Inactivo'}</span>
                </div>
                <h3 className="font-display text-xl mb-0.5">{team.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{team.faculty || 'Sin facultad'}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-secondary/50 rounded-lg py-1.5">
                    <div className="font-display text-sm tabular-nums">{team.wins}</div>
                    <div className="text-[10px] text-muted-foreground">Victorias</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg py-1.5">
                    <div className="font-display text-sm tabular-nums">{team.draws}</div>
                    <div className="text-[10px] text-muted-foreground">Empates</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg py-1.5">
                    <div className="font-display text-sm tabular-nums">{team.losses}</div>
                    <div className="text-[10px] text-muted-foreground">Derrotas</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <UsersIcon className="w-3 h-3" /> {team.members_count} miembros
                  </div>
                  <div className="font-display text-lg tabular-nums gradient-text">{team.total_points.toLocaleString()}</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-card card-shadow rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">#</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Equipo</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Facultad</th>
                    <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">V</th>
                    <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">E</th>
                    <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">D</th>
                    <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Puntos</th>
                    <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">Estado</th>
                    <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((team) => (
                    <tr key={team.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: team.color, color: '#fff' }}>{team.number}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">{team.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{team.faculty || '-'}</td>
                      <td className="px-4 py-3 text-center tabular-nums">{team.wins}</td>
                      <td className="px-4 py-3 text-center tabular-nums">{team.draws}</td>
                      <td className="px-4 py-3 text-center tabular-nums">{team.losses}</td>
                      <td className="px-4 py-3 text-right font-display text-base tabular-nums">{team.total_points.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          team.status === 'active' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                        }`}>{team.status === 'active' ? 'Activo' : team.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(team)} className="p-1.5 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openDelete(team)} className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Editar Equipo" : "Nuevo Equipo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre del equipo" />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input type="number" value={form.number} onChange={e => setForm({ ...form, number: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Facultad</Label>
              <Input value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })} placeholder="Facultad" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                  <span className="text-xs text-muted-foreground">{form.color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="disqualified">Descalificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Miembros</Label>
                <Input type="number" value={form.members_count} onChange={e => setForm({ ...form, members_count: parseInt(e.target.value) || 0 })} />
              </div>
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
            <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará el equipo permanentemente.</AlertDialogDescription>
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
