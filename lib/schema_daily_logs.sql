-- Run this in the Supabase SQL Editor if daily logs are not persisting.
-- Safe to run multiple times (all statements are idempotent).

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date     date NOT NULL,
  phase_answers jsonb DEFAULT '{}'::jsonb,
  notes        text,
  updated_at   timestamptz DEFAULT now(),
  created_at   timestamptz DEFAULT now()
);

-- 2. Add updated_at column if missing (safe no-op if it already exists)
ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Unique constraint required for upsert onConflict: 'user_id,log_date'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'daily_logs_user_id_log_date_key'
      AND conrelid = 'public.daily_logs'::regclass
  ) THEN
    ALTER TABLE public.daily_logs
      ADD CONSTRAINT daily_logs_user_id_log_date_key UNIQUE (user_id, log_date);
  END IF;
END $$;

-- 4. Row-Level Security
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies cleanly
DROP POLICY IF EXISTS "Users can read own logs"   ON public.daily_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON public.daily_logs;

CREATE POLICY "Users can read own logs"   ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);

-- 5. Index for fast per-user queries
CREATE INDEX IF NOT EXISTS daily_logs_user_date_idx ON public.daily_logs (user_id, log_date DESC);
