-- Add invite_code column to profiles table for partner linking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Create function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-generate invite code on profile creation
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = NEW.invite_code) LOOP
      NEW.invite_code := generate_invite_code();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate invite code
DROP TRIGGER IF EXISTS trigger_set_invite_code ON public.profiles;
CREATE TRIGGER trigger_set_invite_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();

-- Backfill invite codes for existing profiles
UPDATE public.profiles
SET invite_code = generate_invite_code()
WHERE invite_code IS NULL;
