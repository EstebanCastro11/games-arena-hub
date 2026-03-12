import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Eye, EyeOff, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"admin" | "captain">("admin");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
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

          {/* Role Toggle */}
          <div className="flex bg-secondary rounded-lg p-1 mb-6">
            <button
              onClick={() => setRole("admin")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                role === "admin" ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Admin / Juez
            </button>
            <button
              onClick={() => setRole("captain")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                role === "captain" ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Capitán
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@eafit.edu.co"
                className="w-full bg-background rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background rounded-lg px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button className="w-full gradient-primary py-3 rounded-lg font-medium text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Entrar
            </button>
          </div>

          {role === "captain" && (
            <div className="mt-4 text-center">
              <Link to="/registro" className="text-sm text-primary hover:underline">
                ¿No tienes cuenta? Regístrate como capitán
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground transition-colors">← Volver al Hub</Link>
        </p>
      </motion.div>
    </div>
  );
}
