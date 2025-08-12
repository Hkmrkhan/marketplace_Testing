-- Add Approval and Commission Functionality
-- Run this in Supabase SQL Editor

-- Add approval_status column to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add commission_rate column to cars table (default 10%)
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.00;

-- Add commission_amount column to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add approved_by column to track which admin approved
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Add approved_at column to track when car was approved
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add rejection_reason column for rejected cars
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create admin_approvals table to track approval history
CREATE TABLE IF NOT EXISTS admin_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id),
    approval_status TEXT NOT NULL CHECK (approval_status IN ('approved', 'rejected')),
    approval_notes TEXT,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create commission_transactions table
CREATE TABLE IF NOT EXISTS commission_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id),
    buyer_id UUID REFERENCES auth.users(id),
    sale_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_approval_status ON cars(approval_status);
CREATE INDEX IF NOT EXISTS idx_cars_approved_by ON cars(approved_by);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_car_id ON admin_approvals(car_id);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_admin_id ON admin_approvals(admin_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_car_id ON commission_transactions(car_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_seller_id ON commission_transactions(seller_id);

-- Enable RLS on new tables
ALTER TABLE admin_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_approvals table
CREATE POLICY "Admins can view all approvals" ON admin_approvals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can insert approvals" ON admin_approvals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- Create policies for commission_transactions table
CREATE POLICY "Admins can view all commission transactions" ON commission_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Sellers can view their own commission transactions" ON commission_transactions
    FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Admins can insert commission transactions" ON commission_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- Create view for cars with approval details
CREATE OR REPLACE VIEW cars_with_approval_details AS
SELECT 
    c.*,
    p.full_name as seller_name,
    p.email as seller_email,
    p.whatsapp_number as seller_whatsapp,
    admin.full_name as admin_name,
    admin.email as admin_email
FROM cars c
LEFT JOIN profiles p ON c.seller_id = p.id
LEFT JOIN profiles admin ON c.approved_by = admin.id;

-- Grant permissions on the view
GRANT SELECT ON cars_with_approval_details TO authenticated;
GRANT SELECT ON cars_with_approval_details TO anon;

-- Create function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission(
    sale_amount DECIMAL(10,2),
    commission_rate DECIMAL(5,2) DEFAULT 10.00
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (sale_amount * commission_rate / 100.00);
END;
$$;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION calculate_commission TO authenticated;

-- Create function to approve car
CREATE OR REPLACE FUNCTION approve_car(
    car_id_param UUID,
    admin_id_param UUID,
    approval_notes_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update car approval status
    UPDATE cars 
    SET 
        approval_status = 'approved',
        approved_by = admin_id_param,
        approved_at = NOW()
    WHERE id = car_id_param;
    
    -- Insert into admin_approvals table
    INSERT INTO admin_approvals (
        car_id, 
        admin_id, 
        approval_status, 
        approval_notes
    ) VALUES (
        car_id_param, 
        admin_id_param, 
        'approved', 
        approval_notes_param
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION approve_car TO authenticated;

-- Create function to reject car
CREATE OR REPLACE FUNCTION reject_car(
    car_id_param UUID,
    admin_id_param UUID,
    rejection_reason_param TEXT,
    approval_notes_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update car approval status
    UPDATE cars 
    SET 
        approval_status = 'rejected',
        rejection_reason = rejection_reason_param,
        approved_by = admin_id_param,
        approved_at = NOW()
    WHERE id = car_id_param;
    
    -- Insert into admin_approvals table
    INSERT INTO admin_approvals (
        car_id, 
        admin_id, 
        approval_status, 
        approval_notes
    ) VALUES (
        car_id_param, 
        admin_id_param, 
        'rejected', 
        approval_notes_param
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION reject_car TO authenticated;

-- Update existing cars to have pending approval status if not already set
UPDATE cars 
SET approval_status = 'pending' 
WHERE approval_status IS NULL;

-- Update existing cars to have approved status if they are available or sold
UPDATE cars 
SET approval_status = 'approved' 
WHERE status IN ('available', 'sold') AND approval_status = 'pending';

