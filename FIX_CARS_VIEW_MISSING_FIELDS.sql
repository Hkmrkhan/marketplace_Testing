-- Fix cars_with_seller view to include missing fields
-- Run this in Supabase SQL Editor

-- First, add missing columns to cars table if they don't exist
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2020;

ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS miles INTEGER DEFAULT 0;

ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Other';

-- Update existing cars to have default values
UPDATE cars 
SET year = 2020 
WHERE year IS NULL;

UPDATE cars 
SET miles = 0 
WHERE miles IS NULL;

UPDATE cars 
SET district = 'Other' 
WHERE district IS NULL;

-- Drop the old view
DROP VIEW IF EXISTS cars_with_seller;

-- Create the fixed view with ALL fields
CREATE VIEW cars_with_seller AS
SELECT 
    c.id as car_id,
    c.title,
    c.description,
    c.price,
    c.year,
    c.miles,
    c.district,
    c.status,
    c.created_at,
    c.image_url,
    c.additional_images,
    c.seller_id,
    p.full_name as seller_name,
    p.email as seller_email,
    p.whatsapp_number as seller_whatsapp
FROM cars c
LEFT JOIN profiles p ON c.seller_id = p.id
WHERE c.status IN ('available', 'sold')
ORDER BY 
    CASE WHEN c.status = 'available' THEN 0 ELSE 1 END,
    c.created_at DESC;

-- Grant permissions
GRANT SELECT ON cars_with_seller TO anon;
GRANT SELECT ON cars_with_seller TO authenticated;

-- Verify the view has all fields
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'cars_with_seller' 
ORDER BY ordinal_position;

-- Test the view with sample data
SELECT 
    car_id,
    title,
    year,
    miles,
    district,
    status,
    seller_name
FROM cars_with_seller 
LIMIT 3;

