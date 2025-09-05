-- AI Chatbot View for Your Marketplace Database - OPTIMIZED VERSION
-- Copy-paste this in Supabase SQL Editor

-- Drop existing view if exists
DROP VIEW IF EXISTS ai_marketplace_data;

-- Create optimized AI view with safe data handling
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
    c.miles,
    c.year,
    c.reg_district,
    c.district,
    
    -- Seller information from profiles
    p.full_name as seller_name,
    p.email as seller_email,
    p.user_type,
    p.whatsapp_number as seller_whatsapp,
    
    -- Safe price analysis for AI
    CASE 
        WHEN c.price IS NULL OR c.price = '' OR c.price = '0' OR c.price = 'null' THEN 'unknown'
        WHEN c.price ~ '^[0-9]+(\.[0-9]+)?$' AND CAST(c.price AS NUMERIC) <= 1000 THEN 'budget'
        WHEN c.price ~ '^[0-9]+(\.[0-9]+)?$' AND CAST(c.price AS NUMERIC) <= 5000 THEN 'mid-range'
        WHEN c.price ~ '^[0-9]+(\.[0-9]+)?$' AND CAST(c.price AS NUMERIC) <= 10000 THEN 'premium'
        WHEN c.price ~ '^[0-9]+(\.[0-9]+)?$' THEN 'luxury'
        ELSE 'unknown'
    END as price_category,
    
    -- Safe price formatting
    CASE 
        WHEN c.price IS NOT NULL AND c.price != '' AND c.price != '0' AND c.price != 'null' 
             AND c.price ~ '^[0-9]+(\.[0-9]+)?$'
        THEN CONCAT('$', c.price)
        ELSE 'Price not set'
    END as formatted_price,
    
    -- Safe numeric conversion
    CASE 
        WHEN c.price IS NOT NULL AND c.price != '' AND c.price != '0' AND c.price != 'null'
             AND c.price ~ '^[0-9]+(\.[0-9]+)?$'
        THEN CAST(c.price AS NUMERIC)
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
    
    -- Safe price ranges for AI
    CASE 
        WHEN c.price IS NULL OR c.price = '' OR c.price = '0' OR c.price = 'null' 
             OR NOT (c.price ~ '^[0-9]+(\.[0-9]+)?$') THEN 'unknown'
        WHEN CAST(c.price AS NUMERIC) < 500 THEN 'very_cheap'
        WHEN CAST(c.price AS NUMERIC) < 1000 THEN 'cheap'
        WHEN CAST(c.price AS NUMERIC) < 3000 THEN 'affordable'
        WHEN CAST(c.price AS NUMERIC) < 7000 THEN 'moderate'
        WHEN CAST(c.price AS NUMERIC) < 12000 THEN 'expensive'
        ELSE 'very_expensive'
    END as ai_price_range,
    
    -- Days since listing
    EXTRACT(DAYS FROM (NOW() - c.created_at)) as days_since_listed,
    
    -- Seller activity
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
    END as additional_images_count,
    
    -- City information (combine both district fields)
    COALESCE(
        NULLIF(c.reg_district, ''),
        NULLIF(c.district, ''),
        'Unknown'
    ) as city

FROM cars c
LEFT JOIN profiles p ON c.seller_id = p.id
WHERE c.title IS NOT NULL 
  AND c.title != ''
  AND c.title != 'null'
ORDER BY 
    CASE WHEN c.status = 'available' THEN 0 ELSE 1 END,
    c.created_at DESC;

-- Create safe performance indexes
CREATE INDEX IF NOT EXISTS idx_ai_cars_status 
ON cars USING btree(status);

CREATE INDEX IF NOT EXISTS idx_ai_cars_created 
ON cars USING btree(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cars_seller 
ON cars USING btree(seller_id);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_ai_cars_title_search 
ON cars USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_ai_cars_description_search 
ON cars USING gin(to_tsvector('english', description));

-- Grant permissions
GRANT SELECT ON ai_marketplace_data TO anon;
GRANT SELECT ON ai_marketplace_data TO authenticated;

-- Safe helper function for price searches
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

-- Grant function permissions
GRANT EXECUTE ON FUNCTION get_cars_by_price_range TO anon;
GRANT EXECUTE ON FUNCTION get_cars_by_price_range TO authenticated;

-- Safe stats function
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

-- Grant stats function permissions
GRANT EXECUTE ON FUNCTION get_marketplace_stats TO anon;
GRANT EXECUTE ON FUNCTION get_marketplace_stats TO authenticated; 