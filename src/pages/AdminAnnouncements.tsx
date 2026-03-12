import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Plus, Trash2, AlertTriangle, Info, Zap } from "lucide-react";
import { demoAnnouncements, type Announcement } from "@/data/demo";
import AdminLayout from "@/components/AdminLayout";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(demoAnnouncements);
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState<"info" | "warning" | "urgent">("info");

  const addAnnouncement = () => {
    if (!newMessage.trim()) return;
    const ann: Announcement = {
      id: Date.now(),
      message: newMessage,
      type: newType,
      timestamp: new Date().toISOString(),
      active: true,
    };
    setAnnouncements([ann, ...announcements]);
    setNewMessage("");
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl mb-1">ANUNCIOS</h1>
        <p className="text-sm text-muted-foreground mb-6">Publica mensajes visibles en el hub público</p>

        {/* New Announcement */}
        <div className="bg-card card-shadow rounded-2xl p-5 mb-6">
          <h3 className="font-display text-lg mb-3">NUEVO ANUNCIO</h3>
          <div className="space-y-3">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Escribe el anuncio aquí..."
              rows={2}
              className="w-full bg-background rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card resize-none"
            />
            <div className="flex items-center gap-3">
              <div className="flex gap-2 flex-1">
                {([
                  { key: 'info', label: 'Info', icon: Info },
                  { key: 'warning', label: 'Alerta', icon: AlertTriangle },
                  { key: 'urgent', label: 'Urgente', icon: Zap },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setNewType(t.key)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      newType === t.key
                        ? t.key === 'urgent' ? 'bg-destructive/20 text-destructive' :
                          t.key === 'warning' ? 'bg-accent/20 text-accent' :
                          'bg-primary/20 text-primary'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <t.icon className="w-3 h-3" /> {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={addAnnouncement}
                disabled={!newMessage.trim()}
                className="gradient-primary px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1"
              >
                <Megaphone className="w-3 h-3" /> Publicar
              </button>
            </div>
          </div>
        </div>

        {/* Existing */}
        <div className="space-y-3">
          {announcements.map((a, idx) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`bg-card card-shadow rounded-xl p-4 flex items-start gap-3 border-l-4 ${
                a.type === 'urgent' ? 'border-l-destructive' :
                a.type === 'warning' ? 'border-l-accent' :
                'border-l-primary'
              }`}
            >
              <div className="flex-1">
                <p className="text-sm">{a.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(a.timestamp).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    a.active ? 'bg-success/20 text-success' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {a.active ? 'Activo' : 'Oculto'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAnnouncements(announcements.filter(x => x.id !== a.id))}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
