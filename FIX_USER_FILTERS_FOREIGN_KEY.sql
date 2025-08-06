-- Fix user_filters foreign key constraint issue
-- Run this in Supabase SQL Editor

-- Option 1: Drop the foreign key constraint (if you want to allow any user_id)
ALTER TABLE user_filters DROP CONSTRAINT IF EXISTS user_filters_user_id_fkey;

-- Option 2: Create a test user in profiles table (if you want to keep foreign key)
-- INSERT INTO profiles (id, email, user_type, created_at, updated_at)
-- VALUES (
--   '123e4567-e89b-12d3-a456-426614174000',
--   'test@example.com',
--   'buyer',
--   NOW(),
--   NOW()
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Option 3: Change user_filters table to not require foreign key
-- ALTER TABLE user_filters ALTER COLUMN user_id TYPE TEXT;
-- ALTER TABLE user_filters DROP CONSTRAINT IF EXISTS user_filters_user_id_fkey;

-- Verify the change
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_filters' AND column_name = 'user_id'; 