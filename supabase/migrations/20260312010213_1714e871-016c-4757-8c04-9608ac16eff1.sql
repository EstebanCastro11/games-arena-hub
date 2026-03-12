
-- Add epik_id and phone to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS epik_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Enable realtime for match_results and matchups
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matchups;
