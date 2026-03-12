import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/apuestas" element={<Betting />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/equipos" element={<AdminTeams />} />
          <Route path="/admin/competencias" element={<AdminCompetitions />} />
          <Route path="/admin/enfrentamientos" element={<AdminMatchups />} />
          <Route path="/admin/puntajes" element={<AdminScoring />} />
          <Route path="/admin/rotaciones" element={<AdminRotations />} />
          <Route path="/admin/apuestas" element={<AdminBetting />} />
          <Route path="/admin/anuncios" element={<AdminAnnouncements />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
