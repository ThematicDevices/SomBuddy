-- Supabase Schema for Sommelier Wine Catalog
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Wines table
create table public.wines (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  producer text not null,
  wine_name text not null,
  vintage integer,
  region text not null,
  sub_region text,
  country text not null,
  appellation text,
  varietals jsonb default '[]'::jsonb,
  wine_color text not null default 'red',
  alcohol_content numeric(4,2),
  purchase_date date,
  purchase_price numeric(10,2),
  purchased_from text,
  estimated_value numeric(10,2),
  quantity integer default 1,
  storage_location text,
  bottle_condition text default 'unknown',
  tasting_notes jsonb default '[]'::jsonb,
  drinking_window_start integer,
  drinking_window_end integer,
  drinking_status text default 'unknown',
  pairing_suggestions text[] default '{}',
  personal_rating integer check (personal_rating >= 1 and personal_rating <= 100),
  is_open boolean default false,
  why_purchased text,
  provenance text,
  story text,
  label_image_url text,
  consumption_history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat history table
create table public.chat_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  wine_recommendations text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.wines enable row level security;
alter table public.chat_history enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Wines policies
create policy "Users can view own wines"
  on public.wines for select
  using (auth.uid() = user_id);

create policy "Users can insert own wines"
  on public.wines for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wines"
  on public.wines for update
  using (auth.uid() = user_id);

create policy "Users can delete own wines"
  on public.wines for delete
  using (auth.uid() = user_id);

-- Chat history policies
create policy "Users can view own chat history"
  on public.chat_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own chat history"
  on public.chat_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own chat history"
  on public.chat_history for delete
  using (auth.uid() = user_id);

-- Function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger set_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.wines
  for each row execute procedure public.handle_updated_at();

-- Create index for faster queries
create index wines_user_id_idx on public.wines(user_id);
create index wines_region_idx on public.wines(region);
create index wines_wine_color_idx on public.wines(wine_color);
create index chat_history_user_id_idx on public.chat_history(user_id);
create index chat_history_created_at_idx on public.chat_history(created_at);
