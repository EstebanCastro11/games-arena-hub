import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Eye, EyeOff, Lock, Loader2, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError("Credenciales incorrectas. Intenta de nuevo.");
      setIsLoading(false);
      return;
    }

    // Fetch role and redirect accordingly
    const { data } = await supabase.from("user_roles").select("role").single();
    setIsLoading(false);

    if (data?.role === "captain") navigate("/capitan");
    else if (data?.role === "judge") navigate("/juez");
    else navigate("/admin");
  };

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
          <p className="text-sm text-muted-foreground mt-1">DÍAS EAFIT 2026</p>
        </div>

        <div className="bg-card card-shadow rounded-2xl p-6">
          <h2 className="font-display text-2xl mb-1">INICIAR SESIÓN</h2>
          <p className="text-sm text-muted-foreground mb-6">Ingresa tus credenciales para continuar</p>

          <div className="bg-secondary/50 rounded-xl p-4 mb-6 space-y-2">
            <p className="text-xs font-medium text-foreground">🧪 Usuarios de prueba:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong className="text-foreground">Admin:</strong> admin@thegames.com / admin123</p>
              <p><strong className="text-foreground">Capitán:</strong> capitan@thegames.com / capitan123</p>
              <p><strong className="text-foreground">Juez:</strong> juez@thegames.com / juez123</p>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-2 mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Correo electrónico</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@eafit.edu.co" required
                className="w-full bg-background rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Contraseña</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full bg-background rounded-lg px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full gradient-primary py-3 rounded-lg font-medium text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4" /> Entrar</>}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/registro" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
              <UserPlus className="w-3 h-3" /> Registrarse como Capitán
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground transition-colors">← Volver al Hub</Link>
        </p>
      </motion.div>
    </div>
  );
}
