-- Fix Description Issue in Database
-- Run this in Supabase SQL Editor

-- Update the problematic description that contains Supabase link
UPDATE cars 
SET description = 'Luxury car with premium features and excellent condition. Perfect for those looking for a high-end vehicle with all modern amenities. Contact seller for more details and test drive.'
WHERE description LIKE '%luxuryhttps://supabase.com/dashboard/project/%';

-- Update descriptions with Bing image URLs
UPDATE cars 
SET description = 'Premium car with great features. Well maintained and ready for sale. Contact seller for more information.'
WHERE description LIKE '%https://th.bing.com/th?%';

-- Update any other descriptions that might have similar issues
UPDATE cars 
SET description = 'Premium car with great features. Well maintained and ready for sale. Contact seller for more information.'
WHERE description LIKE '%https://supabase.com/dashboard/project/%';

-- Update descriptions that have mixed content with prices
UPDATE cars 
SET description = 'Luxury car with excellent features. Contact seller for more details.'
WHERE description LIKE '%25000%' OR description LIKE '%30000%';

-- Update any empty or null descriptions
UPDATE cars 
SET description = 'Car details available. Contact seller for more information.'
WHERE description IS NULL OR description = '' OR description = 'null';

-- Show the updated cars
SELECT id, title, description, price, status 
FROM cars 
WHERE status = 'available' 
ORDER BY created_at DESC; 