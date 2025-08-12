-- Fix Car Title Error in Admin Commissions
-- Run this in Supabase SQL Editor to fix the null car_title error

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS trigger_create_enhanced_commission ON purchases;

-- Drop the existing function
DROP FUNCTION IF EXISTS create_enhanced_admin_commission();

-- Create the fixed trigger function
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

-- Recreate the trigger
CREATE TRIGGER trigger_create_enhanced_commission
    AFTER INSERT ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION create_enhanced_admin_commission();

-- Fix any existing records with null car_title
UPDATE admin_commissions 
SET car_title = 'Car ID: ' || car_id::text
WHERE car_title IS NULL OR car_title = '';

-- Verify the fix
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN car_title IS NULL THEN 1 END) as null_titles,
    COUNT(CASE WHEN car_title = '' THEN 1 END) as empty_titles
FROM admin_commissions;
