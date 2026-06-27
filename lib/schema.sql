-- =============================================
-- Period Tracker - Supabase Database Schema
-- Run this entire file in the Supabase SQL Editor
-- =============================================

-- PROFILES (extends auth.users)
create table public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  username        text unique,
  first_name      text,
  last_name       text,
  age             integer,
  height_cm       numeric,
  height_ft       integer,
  height_in       integer,
  height_unit     text default 'cm',
  weight          numeric,
  cycle_length    integer default 28,
  period_length   integer default 5,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);


-- PERIODS (period history)
create table public.periods (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  start_date  date not null,
  end_date    date,
  flow_type   text,
  symptoms    text[],
  moods       text[],
  mood_notes  text,
  created_at  timestamptz default now()
);

alter table public.periods enable row level security;

create policy "Users can manage own periods"
  on public.periods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- DAILY LOGS
create table public.daily_logs (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  log_date      date not null,
  phase_answers jsonb,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id, log_date)
);

alter table public.daily_logs enable row level security;

create policy "Users can manage own daily logs"
  on public.daily_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- USER GOALS
create table public.user_goals (
  user_id     uuid references auth.users(id) on delete cascade primary key,
  goals       text[],
  created_at  timestamptz default now()
);

alter table public.user_goals enable row level security;

create policy "Users can manage own goals"
  on public.user_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- NOTIFICATION SETTINGS
create table public.notification_settings (
  user_id             uuid references auth.users(id) on delete cascade primary key,
  period_reminder     boolean default true,
  ovulation_alert     boolean default true,
  daily_log_reminder  boolean default false,
  created_at          timestamptz default now()
);

alter table public.notification_settings enable row level security;

create policy "Users can manage own notification settings"
  on public.notification_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
