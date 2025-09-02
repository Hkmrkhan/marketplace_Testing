-- Car Comparison Feature Setup
-- Run this in Supabase SQL Editor

-- 1. Add missing columns to cars table for comparison
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS miles INTEGER DEFAULT 0;

ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS reg_district TEXT DEFAULT 'Other';

ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2020;

ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS additional_images TEXT[];

-- 2. Update existing cars with default values
UPDATE cars 
SET miles = 0 
WHERE miles IS NULL;

UPDATE cars 
SET reg_district = 'Other' 
WHERE reg_district IS NULL;

UPDATE cars 
SET year = 2020 
WHERE year IS NULL;

-- 3. Create or update the cars_with_seller_enhanced view
DROP VIEW IF EXISTS cars_with_seller_enhanced;

CREATE VIEW cars_with_seller_enhanced AS
SELECT 
    c.id,
    c.title,
    c.description,
    c.price,
    c.miles,
    c.reg_district,
    c.year,
    c.status,
    c.created_at,
    c.updated_at,
    c.image_url,
    c.additional_images,
    c.seller_id,
    c.approval_status,
    p.email as seller_email,
    p.full_name as seller_name,
    p.phone as seller_phone,
    p.user_type as seller_type,
    p.avatar_url as seller_avatar
FROM cars c
LEFT JOIN profiles p ON c.seller_id = p.id
WHERE c.status IN ('available', 'sold')
ORDER BY 
    CASE WHEN c.status = 'available' THEN 0 ELSE 1 END,
    c.created_at DESC;

-- 4. Grant permissions to the view
GRANT SELECT ON cars_with_seller_enhanced TO anon;
GRANT SELECT ON cars_with_seller_enhanced TO authenticated;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_miles ON cars USING btree(miles);
CREATE INDEX IF NOT EXISTS idx_cars_reg_district ON cars USING btree(reg_district);
CREATE INDEX IF NOT EXISTS idx_cars_year ON cars USING btree(year);
CREATE INDEX IF NOT EXISTS idx_cars_price ON cars USING btree(price);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars USING btree(status);

-- 6. Test the view
SELECT 
    id,
    title,
    price,
    miles,
    reg_district,
    year,
    status,
    seller_name
FROM cars_with_seller_enhanced 
LIMIT 5;

-- 7. Check if the view has all required fields
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'cars_with_seller_enhanced' 
ORDER BY ordinal_position;
