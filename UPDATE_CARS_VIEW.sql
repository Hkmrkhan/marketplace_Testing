-- Update cars_with_seller view to include new columns
-- Run this in Supabase SQL Editor

-- Drop the old view
DROP VIEW IF EXISTS cars_with_seller;

-- Create updated view with new columns
CREATE VIEW cars_with_seller AS
SELECT 
  c.id,
  c.title,
  c.description,
  c.price,
  c.miles,           -- Added miles column
  c.reg_district,    -- Added reg_district column
  c.year,            -- Added year column
  c.status,
  c.created_at,
  c.updated_at,
  c.seller_id,
  c.buyer_id,
  p.email as seller_email,
  p.full_name as seller_name,
  p.phone as seller_phone,
  p.user_type as seller_type
FROM cars c
LEFT JOIN profiles p ON c.seller_id = p.id;

-- Verify the updated view
SELECT 
  id,
  title,
  price,
  miles,
  reg_district,
  year,
  status
FROM cars_with_seller 
LIMIT 5; 