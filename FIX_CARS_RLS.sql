-- Fix RLS policies for cars table and handle seller_id
-- Run this in Supabase SQL Editor

-- First, add seller_id column if it doesn't exist
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id);

-- Add additional_images column for multiple images
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS additional_images TEXT[];

-- Add whatsapp_number column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

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

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing profiles policies if any
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Allow chat users to see names" ON profiles;

-- Create policy to allow all users to view profiles
CREATE POLICY "Users can view profiles" ON profiles
    FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert profiles (FIXED VERSION)
CREATE POLICY "Users can insert profiles" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- Create or replace the purchases_with_details view
DROP VIEW IF EXISTS purchases_with_details;
CREATE VIEW purchases_with_details AS
SELECT 
    p.id, p.car_id, p.buyer_id, p.seller_id, p.amount, p.purchase_date,
    c.title, c.description, c.price, c.image_url, c.additional_images, c.status,
    buyer.full_name as buyer_name, buyer.email as buyer_email, buyer.whatsapp_number as buyer_whatsapp,
    seller.full_name as seller_name, seller.email as seller_email, seller.whatsapp_number as seller_whatsapp
FROM purchases p
LEFT JOIN cars c ON p.car_id = c.id
LEFT JOIN profiles buyer ON p.buyer_id = buyer.id
LEFT JOIN profiles seller ON p.seller_id = seller.id;

-- Grant permissions on the view
GRANT SELECT ON purchases_with_details TO authenticated;
GRANT SELECT ON purchases_with_details TO anon;

-- Create messages table for chat functionality
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages table
CREATE POLICY "Users can view messages for their cars" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id OR
        auth.uid() IN (
            SELECT seller_id FROM cars WHERE id = car_id
        )
    );

CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete messages" ON messages
    FOR DELETE USING (auth.uid() = sender_id);

-- Create messages_with_names view for chat
CREATE OR REPLACE VIEW messages_with_names AS
SELECT
  m.*,
  sender.full_name AS sender_name,
  receiver.full_name AS receiver_name
FROM messages m
LEFT JOIN profiles sender ON m.sender_id = sender.id
LEFT JOIN profiles receiver ON m.receiver_id = receiver.id;

-- Grant permissions on messages_with_names view
GRANT SELECT ON messages_with_names TO authenticated;
GRANT SELECT ON messages_with_names TO anon; 