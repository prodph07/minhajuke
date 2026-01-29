-- Create a partial unique index to prevent duplicates in 'waiting' or 'playing' status
-- This ensures only one instance of a video can be active per establishment at a time.
-- We use COALESCE on user_id just in case, though the main constraint is video_id + establishment_id.

CREATE UNIQUE INDEX IF NOT EXISTS distinct_active_song 
ON queue (establishment_id, video_id) 
WHERE status IN ('waiting', 'playing');
