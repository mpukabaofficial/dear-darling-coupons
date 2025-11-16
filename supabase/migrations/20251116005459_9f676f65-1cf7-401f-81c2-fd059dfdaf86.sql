-- Add avatar_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN avatar_url TEXT;

-- Update RLS policy for profiles to allow partners to see avatars and moods
-- The existing policy already allows partners to view profiles, so avatar_url is automatically accessible