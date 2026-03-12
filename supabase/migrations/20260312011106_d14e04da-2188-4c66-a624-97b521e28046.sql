
-- Table to store the current rotation timer state
CREATE TABLE public.rotation_timer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_id uuid REFERENCES public.rotations(id),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL DEFAULT 300,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.rotation_timer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view timer" ON public.rotation_timer
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage timer" ON public.rotation_timer
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for the timer table
ALTER PUBLICATION supabase_realtime ADD TABLE public.rotation_timer;
