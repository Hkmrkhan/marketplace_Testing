-- AI Chatbot Optimized View
-- Run this in Supabase SQL editor

CREATE OR REPLACE VIEW ai_marketplace_data AS
SELECT 
    c.id as car_id,
    c.title,
    c.description,
    c.price,
    c.status,
    c.created_at,
    c.image_url,
    c.additional_images,
    
    -- Seller information
    p.full_name as seller_name,
    p.email as seller_email,
    p.user_type,
    
    -- Price categories for AI
    CASE 
        WHEN c.price::numeric <= 1000 THEN 'budget'
        WHEN c.price::numeric <= 5000 THEN 'mid-range'
        WHEN c.price::numeric <= 10000 THEN 'premium'
        ELSE 'luxury'
    END as price_category,
    
    -- Price in different formats for AI parsing
    CONCAT('$', c.price) as formatted_price,
    c.price::numeric as numeric_price,
    
    -- Search-friendly fields
    LOWER(c.title || ' ' || COALESCE(c.description, '')) as searchable_text,
    
    -- Availability status
    CASE 
        WHEN c.status = 'available' THEN true
        ELSE false
    END as is_available

FROM cars c
LEFT JOIN profiles p ON c.seller_id = p.id
WHERE c.status IN ('available', 'sold')
ORDER BY 
    CASE WHEN c.status = 'available' THEN 0 ELSE 1 END,
    c.created_at DESC;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_marketplace_price ON cars USING btree(price::numeric);
CREATE INDEX IF NOT EXISTS idx_ai_marketplace_status ON cars USING btree(status);
CREATE INDEX IF NOT EXISTS idx_ai_marketplace_created ON cars USING btree(created_at);

-- Grant permissions
GRANT SELECT ON ai_marketplace_data TO anon;
GRANT SELECT ON ai_marketplace_data TO authenticated; 