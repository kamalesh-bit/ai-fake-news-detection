-- Helper to generate short, URL-safe share IDs
CREATE OR REPLACE FUNCTION public.generate_share_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'abcdefghijkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..10 LOOP
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Updated-at helper (reusable)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Main analyses table
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_id TEXT NOT NULL UNIQUE DEFAULT public.generate_share_id(),
  content TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('likely_real', 'uncertain', 'likely_fake')),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  summary TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  red_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  credibility_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggested_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analyses_user_id_created ON public.analyses(user_id, created_at DESC);
CREATE INDEX idx_analyses_share_id ON public.analyses(share_id);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Owners can see their own analyses
CREATE POLICY "Owners can view their analyses"
  ON public.analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone (including anonymous) can view public analyses (for share links)
CREATE POLICY "Public analyses are viewable by anyone"
  ON public.analyses FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Owners can insert
CREATE POLICY "Owners can create their analyses"
  ON public.analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owners can update (for toggling is_public)
CREATE POLICY "Owners can update their analyses"
  ON public.analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Owners can delete
CREATE POLICY "Owners can delete their analyses"
  ON public.analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();