-- Complete RLS Fix for user_filters table
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

-- Step 3: Re-enable RLS
ALTER TABLE user_filters ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, permissive policies for testing
CREATE POLICY "Allow authenticated users to view their own filters" ON user_filters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own filters" ON user_filters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update their own filters" ON user_filters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete their own filters" ON user_filters
  FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Verify policies were created
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