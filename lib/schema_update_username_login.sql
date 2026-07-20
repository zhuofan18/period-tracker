-- =============================================
-- Migration: username-based login support
-- Run this in the Supabase SQL Editor
-- =============================================

-- 1. Add email column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

-- 2. Update the new-user trigger to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email
  )
  ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username,
        email    = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: look up email by username (callable by unauthenticated users)
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text AS $$
  SELECT email FROM public.profiles WHERE lower(username) = lower(p_username) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon;
