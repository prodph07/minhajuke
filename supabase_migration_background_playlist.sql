-- Create Background Playlists Table
create table if not exists background_playlists (
  id uuid default uuid_generate_v4() primary key,
  establishment_id uuid references establishments(id) not null,
  video_id text not null,
  title text not null,
  channel_title text,
  thumbnail_url text,
  duration_sec integer default 180,
  created_at timestamp with time zone default now()
);

-- RLS Policies
alter table background_playlists enable row level security;

create policy "Enable read access for all users" on background_playlists for select using (true);
create policy "Enable insert for all users" on background_playlists for insert with check (true);
create policy "Enable delete for all users" on background_playlists for delete using (true);
