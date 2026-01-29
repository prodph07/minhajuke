-- Create Playlists Table
create table if not exists playlists (
  id uuid default uuid_generate_v4() primary key,
  establishment_id uuid references establishments(id) not null,
  name text not null,
  is_active boolean default false,
  created_at timestamp with time zone default now()
);

-- RLS for Playlists
alter table playlists enable row level security;
create policy "Enable read access for all users" on playlists for select using (true);
create policy "Enable insert for all users" on playlists for insert with check (true);
create policy "Enable update for all users" on playlists for update using (true);
create policy "Enable delete for all users" on playlists for delete using (true);

-- Add playlist_id to background_playlists
alter table background_playlists add column if not exists playlist_id uuid references playlists(id) on delete cascade;

-- MIGRATION: Create default playlist for existing items if needed
-- This block is tricky in pure SQL without a function, so we'll handle creation in UI or assume empty start for new feature.
-- However, we can try to migrate existing ones if we created a default playlist first.
