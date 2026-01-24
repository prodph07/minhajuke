-- Recreate Queue Table for YouTube
-- If table exists, we drop it to ensure clean schema change (MVP only approach)
drop table if exists queue;

create table queue (
  id uuid default uuid_generate_v4() primary key,
  video_id text not null, -- Changed from spotify_uri
  title text not null,
  channel_title text, -- Changed from artist
  thumbnail_url text, -- Changed from album_art
  status text default 'waiting', -- waiting, playing, played, removed
  created_at timestamp with time zone default now(),
  vote_count integer default 0
);

-- Enable Row Level Security (RLS)
alter table queue enable row level security;

-- Policies (Same as before)
create policy "Enable read access for all users" on queue for select using (true);
create policy "Enable insert for all users" on queue for insert with check (true);
create policy "Enable update for all users" on queue for update using (true);
create policy "Enable delete for all users" on queue for delete using (true);

-- Enable Realtime
alter publication supabase_realtime add table queue;

-- Add user_id to queue table for rate limiting
ALTER TABLE queue ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 1. Create Establishments Table
create table if not exists establishments (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  description text,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- 2. Add establishment_id to queue
-- We accept NULL initially for backward compatibility, but ideally should be NOT NULL.
ALTER TABLE queue ADD COLUMN IF NOT EXISTS establishment_id uuid references establishments(id);

-- 3. Update RLS Policies
-- Establishments: Everyone can read (to validate slug), only admins can insert/update (we'll assume public insert for now for the Super Admin page to work without auth for MVP, or we can secure it later)
alter table establishments enable row level security;

create policy "Enable read access for all users" on establishments for select using (true);
create policy "Enable insert for all users" on establishments for insert with check (true); -- For MVP Super Admin
create policy "Enable update for all users" on establishments for update using (true);

-- Queue: Update policies to be establishment-aware?
-- Currently "Enable read access for all users" is fine.
-- But we might want to ensure people only insert into an establishment that exists.
-- The foreign key constraint handles existence.

