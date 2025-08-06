-- Check Database Content
-- Run this in Supabase SQL Editor

-- Check all cars with their descriptions
SELECT id, title, description, price, status, created_at
FROM cars 
WHERE status = 'available' 
ORDER BY created_at DESC;

-- Check specifically for cars with problematic descriptions
SELECT id, title, description, price, status
FROM cars 
WHERE description LIKE '%supabase%' 
   OR description LIKE '%luxuryhttps%'
   OR description LIKE '%@luxury%'
   OR description LIKE '%schema=public%';

-- Check the specific car that's causing issues
SELECT id, title, description, price, status
FROM cars 
WHERE title LIKE '%Lambergini%' 
   OR title LIKE '%Lamborghini%'; 