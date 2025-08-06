-- Check cars_with_seller view structure
-- Run this in Supabase SQL Editor

-- Check if the view exists and its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'cars_with_seller' 
ORDER BY ordinal_position;

-- Check if there are any cars with miles and reg_district data
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

-- Check the original cars table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'cars' 
ORDER BY ordinal_position; 