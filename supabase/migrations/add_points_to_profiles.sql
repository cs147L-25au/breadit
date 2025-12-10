-- Migration: Add points system to profiles table
-- Run this in your Supabase SQL Editor

-- Step 1: Add points column to profiles table with default value of 0
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0 NOT NULL;

-- Step 2: Create an index on points for leaderboard queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);

-- Step 3: Create a function to safely increment user points
-- This prevents race conditions when multiple point awards happen simultaneously
CREATE OR REPLACE FUNCTION increment_user_points(user_id_input UUID, points_to_add INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET points = COALESCE(points, 0) + points_to_add,
      updated_at = NOW()
  WHERE id = user_id_input;
END;
$$;

-- Step 4: Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION increment_user_points(UUID, INTEGER) TO authenticated;

-- Step 5: (Optional) Create a points history table to track point awards
-- Uncomment if you want to keep a log of all point transactions
/*
CREATE TABLE IF NOT EXISTS points_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  points_awarded INTEGER NOT NULL,
  reason TEXT NOT NULL, -- e.g., 'review_posted', 'comment_added'
  reference_id UUID, -- e.g., review_id or comment_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at DESC);

-- Enable RLS on points_history
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Users can only read their own points history
CREATE POLICY "Users can view own points history" ON points_history
  FOR SELECT USING (auth.uid() = user_id);

-- Only the system can insert points (via service role or functions)
CREATE POLICY "System can insert points history" ON points_history
  FOR INSERT WITH CHECK (true);
*/

-- Step 6: (Optional) Create a view for leaderboard
CREATE OR REPLACE VIEW points_leaderboard AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  points,
  RANK() OVER (ORDER BY points DESC) as rank
FROM profiles
WHERE points > 0
ORDER BY points DESC;

-- Grant access to the leaderboard view
GRANT SELECT ON points_leaderboard TO authenticated;

-- Verification: Check if the migration was successful
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'points'
  ) THEN
    RAISE NOTICE 'Migration successful: points column added to profiles table';
  ELSE
    RAISE EXCEPTION 'Migration failed: points column not found';
  END IF;
END;
$$;

