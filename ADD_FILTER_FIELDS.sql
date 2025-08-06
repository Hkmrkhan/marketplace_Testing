-- Add filter fields to cars table
-- Run this in Supabase SQL Editor

-- Add miles column to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS miles INTEGER DEFAULT 0;

-- Add district column to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Other';

-- Add year column to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2020;

-- Update existing cars to have default values
UPDATE cars 
SET miles = 0 
WHERE miles IS NULL;

UPDATE cars 
SET district = 'Other' 
WHERE district IS NULL;

UPDATE cars 
SET year = 2020 
WHERE year IS NULL;

-- Create indexes for better filter performance
CREATE INDEX IF NOT EXISTS idx_cars_miles ON cars USING btree(miles);
CREATE INDEX IF NOT EXISTS idx_cars_district ON cars USING btree(district);
CREATE INDEX IF NOT EXISTS idx_cars_price ON cars USING btree(price);
CREATE INDEX IF NOT EXISTS idx_cars_year ON cars USING btree(year);

-- Update the cars_with_seller view to include new fields
DROP VIEW IF EXISTS cars_with_seller;
CREATE VIEW cars_with_seller AS
SELECT 
    c.id as car_id,
    c.title,
    c.description,
    c.price,
    c.status,
    c.created_at,
    c.image_url,
    c.additional_images,
    c.miles,
    c.district,
    c.year,
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