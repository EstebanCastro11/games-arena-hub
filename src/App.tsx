import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Hub from "./pages/Hub";
import Leaderboard from "./pages/Leaderboard";
import Betting from "./pages/Betting";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTeams from "./pages/AdminTeams";
import AdminCompetitions from "./pages/AdminCompetitions";
import AdminMatchups from "./pages/AdminMatchups";
import AdminScoring from "./pages/AdminScoring";
import AdminRotations from "./pages/AdminRotations";
import AdminBetting from "./pages/AdminBetting";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import CaptainDashboard from "./pages/CaptainDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Hub />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/apuestas" element={<Betting />} />
            <Route path="/login" element={<Login />} />

            {/* Captain */}
            <Route path="/capitan" element={
              <ProtectedRoute allowedRoles={["captain"]}>
                <CaptainDashboard />
              </ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/equipos" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminTeams />
              </ProtectedRoute>
            } />
            <Route path="/admin/competencias" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminCompetitions />
              </ProtectedRoute>
            } />
            <Route path="/admin/enfrentamientos" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminMatchups />
              </ProtectedRoute>
            } />
            <Route path="/admin/puntajes" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminScoring />
              </ProtectedRoute>
            } />
            <Route path="/admin/rotaciones" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminRotations />
              </ProtectedRoute>
            } />
            <Route path="/admin/apuestas" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminBetting />
              </ProtectedRoute>
            } />
            <Route path="/admin/anuncios" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAnnouncements />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
