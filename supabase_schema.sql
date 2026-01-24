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
