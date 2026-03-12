
-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  captain_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  members_count INTEGER NOT NULL DEFAULT 5,
  faculty TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disqualified')),
  total_points INTEGER NOT NULL DEFAULT 0,
  betting_balance INTEGER NOT NULL DEFAULT 5000,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  matches_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Admins can manage teams" ON public.teams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- BASES TABLE
-- ============================================
CREATE TABLE public.bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  day INTEGER NOT NULL CHECK (day IN (1, 2, 0)),
  description TEXT,
  location TEXT,
  base_type TEXT NOT NULL DEFAULT 'normal' CHECK (base_type IN ('normal', 'macro', 'extra')),
  judge_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view bases" ON public.bases FOR SELECT USING (true);
CREATE POLICY "Admins can manage bases" ON public.bases FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ROTATIONS TABLE
-- ============================================
CREATE TABLE public.rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day INTEGER NOT NULL CHECK (day IN (1, 2)),
  rotation_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(day, rotation_number)
);

ALTER TABLE public.rotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rotations" ON public.rotations FOR SELECT USING (true);
CREATE POLICY "Admins can manage rotations" ON public.rotations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- MATCHUPS TABLE
-- ============================================
CREATE TABLE public.matchups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_id UUID NOT NULL REFERENCES public.rotations(id) ON DELETE CASCADE,
  base_id UUID NOT NULL REFERENCES public.bases(id) ON DELETE CASCADE,
  team_a_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  team_b_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(rotation_id, base_id),
  UNIQUE(rotation_id, team_a_id),
  UNIQUE(rotation_id, team_b_id)
);

ALTER TABLE public.matchups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view matchups" ON public.matchups FOR SELECT USING (true);
CREATE POLICY "Admins can manage matchups" ON public.matchups FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- MATCH RESULTS TABLE
-- ============================================
CREATE TABLE public.match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchup_id UUID NOT NULL UNIQUE REFERENCES public.matchups(id) ON DELETE CASCADE,
  result TEXT NOT NULL CHECK (result IN ('team_a', 'team_b', 'draw')),
  team_a_points INTEGER NOT NULL DEFAULT 0,
  team_b_points INTEGER NOT NULL DEFAULT 0,
  penalties INTEGER NOT NULL DEFAULT 0,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view results" ON public.match_results FOR SELECT USING (true);
CREATE POLICY "Admins can manage results" ON public.match_results FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- BETS TABLE
-- ============================================
CREATE TABLE public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  matchup_id UUID NOT NULL REFERENCES public.matchups(id) ON DELETE CASCADE,
  predicted_result TEXT NOT NULL CHECK (predicted_result IN ('team_a', 'team_b', 'draw')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
  payout INTEGER NOT NULL DEFAULT 0,
  placed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, matchup_id)
);

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view bets" ON public.bets FOR SELECT USING (true);
CREATE POLICY "Captains can place bets" ON public.bets FOR INSERT TO authenticated WITH CHECK (auth.uid() = placed_by);
CREATE POLICY "Admins can manage bets" ON public.bets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'urgent')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_match_results_updated_at BEFORE UPDATE ON public.match_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ADD judge role to enum
-- ============================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'judge';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';
