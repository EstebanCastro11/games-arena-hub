
-- Betting events table (admin creates these)
CREATE TABLE public.betting_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, closed, resolved
  winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Teams participating in a betting event
CREATE TABLE public.betting_event_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.betting_events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  UNIQUE(event_id, team_id)
);

-- Bets placed by captains
CREATE TABLE public.captain_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.betting_events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE, -- the team betting (captain's team)
  predicted_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE, -- who they predict wins
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, won, lost
  payout INTEGER NOT NULL DEFAULT 0,
  placed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, team_id) -- one bet per team per event
);

-- RLS
ALTER TABLE public.betting_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betting_event_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captain_bets ENABLE ROW LEVEL SECURITY;

-- Betting events policies
CREATE POLICY "Anyone can view betting events" ON public.betting_events FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage betting events" ON public.betting_events FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Betting event teams policies
CREATE POLICY "Anyone can view betting event teams" ON public.betting_event_teams FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage betting event teams" ON public.betting_event_teams FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Captain bets policies
CREATE POLICY "Anyone can view bets" ON public.captain_bets FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage bets" ON public.captain_bets FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Captains can place bets" ON public.captain_bets FOR INSERT TO authenticated WITH CHECK (auth.uid() = placed_by);

-- Enable realtime for betting events
ALTER PUBLICATION supabase_realtime ADD TABLE public.betting_events;
