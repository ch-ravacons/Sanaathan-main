/*
  # Create users table for Sanatana Dharma platform

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches auth.users.id
      - `email` (text, unique) - user's email
      - `full_name` (text) - legal name
      - `spiritual_name` (text, optional) - spiritual/initiated name
      - `phone` (text, optional) - contact number
      - `location` (text, optional) - city, state/country
      - `age_group` (text, optional) - age range
      - `gender` (text, optional) - gender identity
      - `interests` (text[], optional) - array of interest IDs
      - `spiritual_path` (text, optional) - chosen spiritual path
      - `path_practices` (text[], optional) - practices within the path
      - `bio` (text, optional) - user bio
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policies for users to read and update their own data
    - Add policy for public read access to basic profile info
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  spiritual_name text,
  phone text,
  location text,
  age_group text,
  gender text,
  interests text[] DEFAULT '{}',
  spiritual_path text,
  path_practices text[] DEFAULT '{}',
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read and update their own data
CREATE POLICY "Users can read and update own data"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for public read access to basic profile info (for community features)
CREATE POLICY "Public read access to basic profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();