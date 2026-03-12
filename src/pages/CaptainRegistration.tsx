import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function CaptainRegistration() {
  const [name, setName] = useState("");
  const [epikId, setEpikId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleType, setRoleType] = useState<"captain" | "judge">("captain");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    if (!epikId.trim()) {
      setError("El ID EPIK es obligatorio.");
      setIsLoading(false);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name, phone, epik_id: epikId, role_type: roleType },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    if (signUpData.user) {
      // Update profile with epik_id and phone
      await supabase
        .from("profiles")
        .update({ epik_id: epikId, phone })
        .eq("user_id", signUpData.user.id);

      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    }

    setIsLoading(false);
  };

  const inputClass = "w-full bg-background rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="font-display text-4xl gradient-text">THE GAMES</h1>
          <p className="text-sm text-muted-foreground mt-1">Registro de Participante</p>
        </div>

        <div className="bg-card card-shadow rounded-2xl p-6">
          {success ? (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-success" />
              </div>
              <h2 className="font-display text-2xl mb-2">¡REGISTRO EXITOSO!</h2>
              <p className="text-sm text-muted-foreground">
                Tu cuenta ha sido creada como <strong>{roleType === 'captain' ? 'Capitán' : 'Juez'}</strong>. 
                Un administrador te asignará tu {roleType === 'captain' ? 'equipo' : 'base'}. 
                Redirigiendo al login...
              </p>
            </motion.div>
          ) : (
            <>
              <h2 className="font-display text-2xl mb-1">REGISTRO</h2>
              <p className="text-sm text-muted-foreground mb-6">Completa el formulario para registrarte en THE GAMES</p>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-2 mb-4 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selection */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">¿Cuál es tu rol?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "captain" as const, label: "🎖️ Capitán", desc: "Líder de equipo" },
                      { key: "judge" as const, label: "⚖️ Juez", desc: "Calificador de base" },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setRoleType(opt.key)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          roleType === opt.key
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        <div className="text-sm font-medium">{opt.label}</div>
                        <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Nombre completo</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre completo" required className={inputClass} />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">ID EPIK</label>
                  <input type="text" value={epikId} onChange={e => setEpikId(e.target.value)} placeholder="Tu ID EPIK" required className={inputClass} />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Correo electrónico</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@eafit.edu.co" required className={inputClass} />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Teléfono</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+57 300 123 4567" className={inputClass} />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Contraseña</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres" required minLength={6}
                      className={`${inputClass} pr-10`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full gradient-primary py-3 rounded-lg font-medium text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Registrarme como {roleType === 'captain' ? 'Capitán' : 'Juez'}</>}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/login" className="hover:text-foreground transition-colors">¿Ya tienes cuenta? Inicia sesión</Link>
        </p>
      </motion.div>
    </div>
  );
}
