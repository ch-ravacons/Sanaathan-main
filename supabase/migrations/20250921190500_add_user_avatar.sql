-- Add avatar_url column for user profile photos
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url text;
