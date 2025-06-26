-- RLS Policies for toothbrushes table
-- This file contains the Supabase RLS policies needed for both authenticated users and guest users

-- Enable RLS on the toothbrushes table
ALTER TABLE toothbrushes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "toothbrushes_select_policy" ON toothbrushes;
DROP POLICY IF EXISTS "toothbrushes_insert_policy" ON toothbrushes;
DROP POLICY IF EXISTS "toothbrushes_update_policy" ON toothbrushes;
DROP POLICY IF EXISTS "toothbrushes_delete_policy" ON toothbrushes;

-- SELECT policy: Allow users to read their own toothbrushes
-- Works for both authenticated users (auth.uid() = user_id) and guest users (user exists with is_guest = true)
CREATE POLICY "toothbrushes_select_policy" ON toothbrushes
FOR SELECT USING (
  -- Authenticated users can access their own toothbrushes
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Guest users (unauthenticated) can access toothbrushes where they exist as guest users
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = toothbrushes.user_id 
    AND users.is_guest = true
  ))
);

-- INSERT policy: Allow users to create toothbrushes for themselves
CREATE POLICY "toothbrushes_insert_policy" ON toothbrushes
FOR INSERT WITH CHECK (
  -- Authenticated users can create toothbrushes for themselves
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Guest users (unauthenticated) can create toothbrushes if they exist as guest users
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = toothbrushes.user_id 
    AND users.is_guest = true
  ))
);

-- UPDATE policy: Allow users to update their own toothbrushes
CREATE POLICY "toothbrushes_update_policy" ON toothbrushes
FOR UPDATE USING (
  -- Authenticated users can update their own toothbrushes
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Guest users (unauthenticated) can update toothbrushes where they exist as guest users
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = toothbrushes.user_id 
    AND users.is_guest = true
  ))
) WITH CHECK (
  -- Same conditions for the updated row
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = toothbrushes.user_id 
    AND users.is_guest = true
  ))
);

-- DELETE policy: Allow users to delete their own toothbrushes
CREATE POLICY "toothbrushes_delete_policy" ON toothbrushes
FOR DELETE USING (
  -- Authenticated users can delete their own toothbrushes
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Guest users (unauthenticated) can delete toothbrushes where they exist as guest users
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = toothbrushes.user_id 
    AND users.is_guest = true
  ))
);

-- Note: These policies handle both user types:
-- 1. Authenticated users: auth.uid() IS NOT NULL and user_id = auth.uid()
-- 2. Guest users: auth.uid() IS NULL but user_id exists in users table with is_guest = true
-- This allows guest toothbrushes to be stored in the backend alongside authenticated user toothbrushes 