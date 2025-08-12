-- Enhanced Admin Commissions Table
-- Run this in Supabase SQL Editor

-- Drop existing table if needed
DROP TABLE IF EXISTS admin_commissions CASCADE;

-- Create enhanced admin_commissions table
CREATE TABLE admin_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    
    -- Car Information
    car_id UUID REFERENCES cars(id),
    car_title TEXT NOT NULL,
    car_price DECIMAL(10,2) NOT NULL,
    car_image_url TEXT,
    
    -- Transaction Details
    sale_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    
    -- User Information
    buyer_id UUID REFERENCES auth.users(id),
    buyer_name TEXT NOT NULL,
    buyer_email TEXT,
    
    seller_id UUID REFERENCES auth.users(id),
    seller_name TEXT NOT NULL,
    seller_email TEXT,
    
    -- Admin Information
    admin_id UUID REFERENCES auth.users(id),
    
    -- Timestamps
    sale_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced trigger function
CREATE OR REPLACE FUNCTION create_enhanced_admin_commission()
RETURNS TRIGGER AS $$
DECLARE
    car_record RECORD;
    buyer_record RECORD;
    seller_record RECORD;
    admin_record RECORD;
BEGIN
    -- Get car information first
    SELECT title, price, image_url INTO car_record
    FROM cars 
    WHERE id = NEW.car_id;
    
    -- Get buyer information
    SELECT full_name, email INTO buyer_record
    FROM profiles 
    WHERE id = NEW.buyer_id;
    
    -- Get seller information
    SELECT full_name, email INTO seller_record
    FROM profiles 
    WHERE id = NEW.seller_id;
    
    -- Get admin information
    SELECT id INTO admin_record
    FROM profiles 
    WHERE user_type = 'admin' 
    LIMIT 1;
    
    -- Insert enhanced commission record when purchase is made
    INSERT INTO admin_commissions (
        sale_id,
        car_id,
        car_title,
        car_price,
        car_image_url,
        sale_amount,
        commission_amount,
        commission_rate,
        buyer_id,
        buyer_name,
        buyer_email,
        seller_id,
        seller_name,
        seller_email,
        admin_id,
        sale_date
    ) VALUES (
        NEW.id, -- purchase id
        NEW.car_id,
        CASE 
            WHEN car_record.title IS NOT NULL AND car_record.title != '' THEN car_record.title
            ELSE 'Car ID: ' || NEW.car_id::text
        END, -- Ensure car_title is never null
        COALESCE(car_record.price, 0), -- Use fetched car price
        car_record.image_url,
        COALESCE(NEW.amount, car_record.price, 0), -- Use car price if amount is null
        COALESCE(NEW.amount * 0.10, car_record.price * 0.10, 0), -- Calculate commission
        10.00,
        NEW.buyer_id,
        COALESCE(buyer_record.full_name, 'Unknown Buyer'),
        buyer_record.email,
        NEW.seller_id,
        COALESCE(seller_record.full_name, 'Unknown Seller'),
        seller_record.email,
        COALESCE(admin_record.id, NEW.buyer_id), -- Fallback to buyer_id if no admin
        COALESCE(NEW.purchase_date, NOW())
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the purchase
        RAISE WARNING 'Error creating admin commission: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_create_enhanced_commission ON purchases;
CREATE TRIGGER trigger_create_enhanced_commission
    AFTER INSERT ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION create_enhanced_admin_commission();

-- Insert existing data for existing purchases (with null handling)
INSERT INTO admin_commissions (
    sale_id,
    car_id,
    car_title,
    car_price,
    car_image_url,
    sale_amount,
    commission_amount,
    commission_rate,
    buyer_id,
    buyer_name,
    buyer_email,
    seller_id,
    seller_name,
    seller_email,
    admin_id,
    sale_date
)
SELECT 
    p.id as sale_id,
    p.car_id,
    COALESCE(c.title, 'Unknown Car') as car_title,
    COALESCE(c.price, 0) as car_price,
    c.image_url as car_image_url,
    COALESCE(p.amount, c.price, 0) as sale_amount, -- Use car price if amount is null
    COALESCE(p.amount * 0.10, c.price * 0.10, 0) as commission_amount, -- Calculate commission
    10.00 as commission_rate,
    p.buyer_id,
    COALESCE(buyer.full_name, 'Unknown Buyer') as buyer_name,
    buyer.email as buyer_email,
    p.seller_id,
    COALESCE(seller.full_name, 'Unknown Seller') as seller_name,
    seller.email as seller_email,
    COALESCE((SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1), p.buyer_id) as admin_id, -- Fallback
    COALESCE(p.purchase_date, NOW()) as sale_date
FROM purchases p
JOIN cars c ON p.car_id = c.id
JOIN profiles buyer ON p.buyer_id = buyer.id
JOIN profiles seller ON p.seller_id = seller.id
WHERE NOT EXISTS (
    SELECT 1 FROM admin_commissions ac WHERE ac.sale_id = p.id
);

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_enhanced_admin_commission() TO authenticated;
