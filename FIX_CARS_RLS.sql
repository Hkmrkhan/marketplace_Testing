-- Fix RLS policies for cars table and handle seller_id
-- Run this in Supabase SQL Editor

-- First, add seller_id column if it doesn't exist
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id);

-- Update existing cars to have a default seller_id (use the first user as default)
UPDATE cars 
SET seller_id = (SELECT id FROM auth.users LIMIT 1) 
WHERE seller_id IS NULL;

-- Now make seller_id NOT NULL
ALTER TABLE cars 
ALTER COLUMN seller_id SET NOT NULL;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all cars" ON cars;
DROP POLICY IF EXISTS "Sellers can insert cars" ON cars;
DROP POLICY IF EXISTS "Users can insert cars" ON cars;
DROP POLICY IF EXISTS "Users can update cars" ON cars;
DROP POLICY IF EXISTS "Users can delete cars" ON cars;

-- Create policy to allow all users to view cars
CREATE POLICY "Users can view all cars" ON cars
    FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert cars
CREATE POLICY "Users can insert cars" ON cars
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow sellers to update their own cars
CREATE POLICY "Sellers can update their own cars" ON cars
    FOR UPDATE USING (auth.uid() = seller_id);

-- Create policy to allow sellers to delete their own cars
CREATE POLICY "Sellers can delete their own cars" ON cars
    FOR DELETE USING (auth.uid() = seller_id);

-- Make sure RLS is enabled
ALTER TABLE cars ENABLE ROW LEVEL SECURITY; 