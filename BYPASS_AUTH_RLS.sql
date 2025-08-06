-- Complete RLS Fix for user_filters table (Authentication Bypass)
-- Run this in Supabase SQL Editor

-- Step 1: Disable RLS temporarily to clear all policies
ALTER TABLE user_filters DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (if any)
DROP POLICY IF EXISTS "Users can view their own filters" ON user_filters;
DROP POLICY IF EXISTS "Users can insert their own filters" ON user_filters;
DROP POLICY IF EXISTS "Users can update their own filters" ON user_filters;
DROP POLICY IF EXISTS "Users can delete their own filters" ON user_filters;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON user_filters;
DROP POLICY IF EXISTS "Allow all operations" ON user_filters;
DROP POLICY IF EXISTS "Allow all users to view filters" ON user_filters;
DROP POLICY IF EXISTS "Allow all users to insert filters" ON user_filters;
DROP POLICY IF EXISTS "Allow all users to update filters" ON user_filters;
DROP POLICY IF EXISTS "Allow all users to delete filters" ON user_filters;

-- Step 3: Re-enable RLS
ALTER TABLE user_filters ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, permissive policies WITHOUT auth checks
CREATE POLICY "Allow all users to view filters" ON user_filters
  FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert filters" ON user_filters
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update filters" ON user_filters
  FOR UPDATE USING (true);

CREATE POLICY "Allow all users to delete filters" ON user_filters
  FOR DELETE USING (true);

-- Step 5: Verify the policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'user_filters';

-- Step 6: Check if RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_filters'; 