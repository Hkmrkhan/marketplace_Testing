-- Admin Commission Fix
-- Run this in Supabase SQL Editor

-- Function to automatically create commission when purchase is made
CREATE OR REPLACE FUNCTION create_admin_commission()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert commission record when purchase is made
    INSERT INTO admin_commissions (
        sale_id,
        commission_amount,
        admin_id
    ) VALUES (
        NEW.id, -- purchase id
        (NEW.amount * 0.10), -- 10% commission
        (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1) -- first admin
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create commission on purchase
DROP TRIGGER IF EXISTS trigger_create_commission ON purchases;
CREATE TRIGGER trigger_create_commission
    AFTER INSERT ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION create_admin_commission();

-- Function to update commission when payment is completed
CREATE OR REPLACE FUNCTION update_commission_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Update commission when payment status changes to 'completed'
    IF NEW.status = 'completed' THEN
        UPDATE admin_commissions 
        SET commission_amount = (SELECT amount FROM purchases WHERE id = (
            SELECT sale_id FROM admin_commissions WHERE sale_id = (
                SELECT id FROM purchases WHERE car_id = NEW.car_id AND buyer_id = NEW.user_id
            )
        )) * 0.10
        WHERE sale_id = (
            SELECT id FROM purchases WHERE car_id = NEW.car_id AND buyer_id = NEW.user_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update commission when payment is completed
DROP TRIGGER IF EXISTS trigger_update_commission ON payments;
CREATE TRIGGER trigger_update_commission
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_commission_on_payment();

-- Insert existing commissions for existing purchases
INSERT INTO admin_commissions (sale_id, commission_amount, admin_id)
SELECT 
    p.id as sale_id,
    (p.amount * 0.10) as commission_amount,
    (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1) as admin_id
FROM purchases p
WHERE NOT EXISTS (
    SELECT 1 FROM admin_commissions ac WHERE ac.sale_id = p.id
);

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_admin_commission() TO authenticated;
GRANT EXECUTE ON FUNCTION update_commission_on_payment() TO authenticated;
