-- =============================================
-- Hideaway Training Quiz — Supabase Setup
-- Run this in Supabase SQL Editor (left sidebar)
-- =============================================

-- 1. Profiles table (stores first name, last name linked to auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  created_at timestamptz default now()
);

-- 2. Quiz scores table
create table if not exists public.quiz_scores (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score int not null,
  total int not null,
  percentage int not null,
  categories text not null,
  created_at timestamptz default now()
);

-- 3. Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.quiz_scores enable row level security;

-- 4. Profiles policies
-- Anyone authenticated can read all profiles (for leaderboard names)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Users can insert their own profile on signup
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 5. Quiz scores policies
-- Anyone authenticated can read all scores (for leaderboard)
create policy "Scores are viewable by authenticated users"
  on public.quiz_scores for select
  using (auth.role() = 'authenticated');

-- Users can insert their own scores
create policy "Users can insert their own scores"
  on public.quiz_scores for insert
  with check (auth.uid() = user_id);
