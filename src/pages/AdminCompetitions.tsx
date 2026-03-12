import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MapPin, Zap, Star, Pencil, Trash2 } from "lucide-react";
import { useBases } from "@/hooks/useGameData";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type DayFilter = "all" | 1 | 2;

type BaseForm = {
  name: string;
  description: string;
  location: string;
  day: number;
  base_type: string;
  active: boolean;
  order_index: number;
};

const emptyForm: BaseForm = { name: "", description: "", location: "", day: 1, base_type: "normal", active: true, order_index: 0 };

export default function AdminCompetitions() {
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const { data: bases = [], isLoading } = useBases();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BaseForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = dayFilter === "all" ? bases : bases.filter(b => b.day === dayFilter);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (base: any) => {
    setEditingId(base.id);
    setForm({ name: base.name, description: base.description || "", location: base.location || "", day: base.day, base_type: base.base_type, active: base.active, order_index: base.order_index });
    setDialogOpen(true);
  };
  const openDelete = (base: any) => { setEditingId(base.id); setDeleteOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase.from("bases").update({
          name: form.name, description: form.description || null, location: form.location || null,
          day: form.day, base_type: form.base_type, active: form.active, order_index: form.order_index,
        }).eq("id", editingId);
        if (error) throw error;
        toast.success("Base actualizada");
      } else {
        const { error } = await supabase.from("bases").insert({
          name: form.name, description: form.description || null, location: form.location || null,
          day: form.day, base_type: form.base_type, active: form.active, order_index: form.order_index,
        });
        if (error) throw error;
        toast.success("Base creada");
      }
      queryClient.invalidateQueries({ queryKey: ["bases"] });
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      const { error } = await supabase.from("bases").delete().eq("id", editingId);
      if (error) throw error;
      toast.success("Base eliminada");
      queryClient.invalidateQueries({ queryKey: ["bases"] });
    } catch (e: any) { toast.error(e.message); }
    setDeleteOpen(false);
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl">BASES / COMPETENCIAS</h1>
            <p className="text-sm text-muted-foreground">{bases.length} bases registradas</p>
          </div>
          <Button onClick={openCreate} className="gradient-primary text-primary-foreground self-start">
            <Plus className="w-4 h-4" /> Nueva Base
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          {([
            { key: "all", label: "Todas" },
            { key: 1, label: "Día 1" },
            { key: 2, label: "Día 2" },
          ] as { key: DayFilter; label: string }[]).map((f) => (
            <button key={String(f.key)} onClick={() => setDayFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dayFilter === f.key ? "gradient-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
              }`}>{f.label}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((base, idx) => (
              <motion.div key={base.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                className="bg-card card-shadow rounded-xl p-5 hover:card-shadow-hover transition-shadow group relative">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                  <button onClick={() => openEdit(base)} className="p-1.5 rounded-lg bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openDelete(base)} className="p-1.5 rounded-lg bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${base.base_type === 'macro' ? 'bg-accent/20' : 'bg-primary/20'}`}>
                    {base.base_type === 'macro' ? <Star className="w-5 h-5 text-accent" /> : <Zap className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {base.base_type === 'macro' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">MACRO</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${base.active ? 'bg-success/20 text-success' : 'bg-secondary text-muted-foreground'}`}>
                      {base.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
                <h3 className="font-display text-xl mb-1">{base.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{base.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {base.location}</div>
                  <span>•</span>
                  <span>Día {base.day}</span>
                  <span>•</span>
                  <span>{base.base_type === 'macro' ? '2000 pts' : '1000 pts'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Editar Base" : "Nueva Base"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre de la base" />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción de la competencia" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ej: Cancha A" />
              </div>
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input type="number" value={form.order_index} onChange={e => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Día</Label>
                <Select value={String(form.day)} onValueChange={v => setForm({ ...form, day: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Día 1</SelectItem>
                    <SelectItem value="2">Día 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.base_type} onValueChange={v => setForm({ ...form, base_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="macro">Macro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Activa</Label>
                <div className="pt-2">
                  <Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} />
                </div>
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
            <AlertDialogTitle>¿Eliminar base?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la base y podría afectar enfrentamientos existentes.</AlertDialogDescription>
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
