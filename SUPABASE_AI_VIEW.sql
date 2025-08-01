-- AI Chatbot View for Your Marketplace Database
-- Copy-paste this in Supabase SQL Editor

-- Drop existing view if exists
DROP VIEW IF EXISTS ai_marketplace_data;

-- Create optimized AI view based on your database structure
CREATE OR REPLACE VIEW ai_marketplace_data AS
SELECT 
    -- Car information
    c.id as car_id,
    c.title,
    c.description,
    c.price,
    c.status,
    c.created_at,
    c.image_url,
    c.additional_images,
    c.seller_id,
    
    -- Seller information from profiles
    p.full_name as seller_name,
    p.email as seller_email,
    p.user_type,
    p.whatsapp_number as seller_whatsapp,
    
    -- Price analysis for AI (safe conversion)
    CASE 
        WHEN c.price IS NULL OR c.price = '' OR c.price = '0' THEN 'unknown'
        WHEN (c.price ~ '^[0-9]+\.?[0-9]*$') AND c.price::numeric <= 1000 THEN 'budget'
        WHEN (c.price ~ '^[0-9]+\.?[0-9]*$') AND c.price::numeric <= 5000 THEN 'mid-range'
        WHEN (c.price ~ '^[0-9]+\.?[0-9]*$') AND c.price::numeric <= 10000 THEN 'premium'
        WHEN (c.price ~ '^[0-9]+\.?[0-9]*$') THEN 'luxury'
        ELSE 'unknown'
    END as price_category,
    
    -- Price formatting for AI responses
    CASE 
        WHEN c.price IS NOT NULL AND c.price != '' AND c.price ~ '^[0-9]+\.?[0-9]*$' 
        THEN CONCAT('$', c.price)
        ELSE 'Price not set'
    END as formatted_price,
    
    -- Safe numeric conversion
    CASE 
        WHEN c.price IS NOT NULL AND c.price != '' AND c.price ~ '^[0-9]+\.?[0-9]*$' 
        THEN c.price::numeric
        ELSE 0
    END as numeric_price,
    
    -- Search optimization
    LOWER(
        COALESCE(c.title, '') || ' ' || 
        COALESCE(c.description, '') || ' ' || 
        COALESCE(p.full_name, '')
    ) as searchable_text,
    
    -- Availability flags
    CASE 
        WHEN c.status = 'available' THEN true
        ELSE false
    END as is_available,
    
    -- Price ranges for AI categorization (safe conversion)
    CASE 
        WHEN c.price IS NULL OR c.price = '' OR NOT (c.price ~ '^[0-9]+\.?[0-9]*$') THEN 'unknown'
        WHEN c.price::numeric < 500 THEN 'very_cheap'
        WHEN c.price::numeric < 1000 THEN 'cheap'
        WHEN c.price::numeric < 3000 THEN 'affordable'
        WHEN c.price::numeric < 7000 THEN 'moderate'
        WHEN c.price::numeric < 12000 THEN 'expensive'
        ELSE 'very_expensive'
    END as ai_price_range,
    
    -- Days since listing (for AI responses)
    EXTRACT(DAYS FROM (NOW() - c.created_at)) as days_since_listed,
    
    -- Seller activity indicator
    CASE 
        WHEN p.user_type = 'seller' THEN true
        ELSE false
    END as is_active_seller,
    
    -- Image availability
    CASE 
        WHEN c.image_url IS NOT NULL AND c.image_url != '' THEN true
        ELSE false
    END as has_images,
    
    -- Additional images count
    CASE 
        WHEN c.additional_images IS NOT NULL THEN 
            array_length(c.additional_images, 1)
        ELSE 0
    END as additional_images_count

FROM cars c
LEFT JOIN profiles p ON c.seller_id = p.id
WHERE c.title IS NOT NULL 
  AND c.title != ''
ORDER BY 
    -- Prioritize available cars
    CASE WHEN c.status = 'available' THEN 0 ELSE 1 END,
    -- Then by creation date (newest first)
    c.created_at DESC;

-- Create performance indexes (safe numeric conversion)
CREATE INDEX IF NOT EXISTS idx_ai_cars_price_numeric 
ON cars USING btree((
    CASE 
        WHEN price IS NOT NULL AND price != '' AND price ~ '^[0-9]+\.?[0-9]*$' 
        THEN price::numeric
        ELSE 0
    END
)) 
WHERE price IS NOT NULL AND price != '' AND price ~ '^[0-9]+\.?[0-9]*$';

CREATE INDEX IF NOT EXISTS idx_ai_cars_status 
ON cars USING btree(status);

CREATE INDEX IF NOT EXISTS idx_ai_cars_created 
ON cars USING btree(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cars_seller 
ON cars USING btree(seller_id);

-- Text search index for better AI queries
CREATE INDEX IF NOT EXISTS idx_ai_cars_title_search 
ON cars USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_ai_cars_description_search 
ON cars USING gin(to_tsvector('english', description));

-- Grant necessary permissions
GRANT SELECT ON ai_marketplace_data TO anon;
GRANT SELECT ON ai_marketplace_data TO authenticated;

-- Create helper function for price-based searches
CREATE OR REPLACE FUNCTION get_cars_by_price_range(
    min_price numeric DEFAULT 0,
    max_price numeric DEFAULT 999999
)
RETURNS TABLE (
    car_id uuid,
    title text,
    price text,
    seller_name text,
    formatted_price text,
    price_category text
) 
LANGUAGE sql
AS $$
    SELECT 
        ai.car_id,
        ai.title,
        ai.price,
        ai.seller_name,
        ai.formatted_price,
        ai.price_category
    FROM ai_marketplace_data ai
    WHERE ai.is_available = true 
      AND ai.numeric_price > 0
      AND ai.numeric_price >= min_price 
      AND ai.numeric_price <= max_price
    ORDER BY ai.numeric_price ASC;
$$;

-- Grant permissions to helper function
GRANT EXECUTE ON FUNCTION get_cars_by_price_range TO anon;
GRANT EXECUTE ON FUNCTION get_cars_by_price_range TO authenticated;

-- Create quick stats function for AI
CREATE OR REPLACE FUNCTION get_marketplace_stats()
RETURNS TABLE (
    total_cars bigint,
    available_cars bigint,
    min_price numeric,
    max_price numeric,
    avg_price numeric,
    active_sellers bigint
)
LANGUAGE sql
AS $$
    SELECT 
        COUNT(*) as total_cars,
        COUNT(*) FILTER (WHERE is_available = true) as available_cars,
        MIN(numeric_price) FILTER (WHERE is_available = true AND numeric_price > 0) as min_price,
        MAX(numeric_price) FILTER (WHERE is_available = true AND numeric_price > 0) as max_price,
        ROUND(AVG(numeric_price) FILTER (WHERE is_available = true AND numeric_price > 0), 0) as avg_price,
        COUNT(DISTINCT seller_id) FILTER (WHERE is_available = true) as active_sellers
    FROM ai_marketplace_data;
$$;

-- Grant permissions to stats function  
GRANT EXECUTE ON FUNCTION get_marketplace_stats TO anon;
GRANT EXECUTE ON FUNCTION get_marketplace_stats TO authenticated;

-- Test the view (optional - comment out in production)
-- SELECT * FROM ai_marketplace_data LIMIT 5;
-- SELECT * FROM get_marketplace_stats();
-- SELECT * FROM get_cars_by_price_range(100, 1000); 