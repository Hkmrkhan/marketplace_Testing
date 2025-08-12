-- Admin Tables for Marketplace

-- Admin approvals table
CREATE TABLE IF NOT EXISTS admin_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin commissions table  
CREATE TABLE IF NOT EXISTS admin_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    commission_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin dashboard view
CREATE OR REPLACE VIEW admin_dashboard_view AS
SELECT 
    c.id as car_id,
    c.title,
    c.price,
    c.status as car_status,
    seller.full_name as seller_name,
    seller.email as seller_email,
    buyer.full_name as buyer_name,
    buyer.email as buyer_email,
    p.amount as sale_amount,
    (p.amount * 0.10) as commission,
    p.purchase_date,
    aa.approval_status,
    aa.approved_at
FROM cars c
LEFT JOIN profiles seller ON c.user_id = seller.id
LEFT JOIN purchases p ON c.id = p.car_id
LEFT JOIN profiles buyer ON p.buyer_id = buyer.id
LEFT JOIN admin_approvals aa ON c.id = aa.car_id;

-- RLS policies for admin tables
ALTER TABLE admin_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_commissions ENABLE ROW LEVEL SECURITY;

-- Admin approvals policies
CREATE POLICY "Admins can view all approvals" ON admin_approvals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can insert approvals" ON admin_approvals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Admin commissions policies
CREATE POLICY "Admins can view all commissions" ON admin_commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can insert commissions" ON admin_commissions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    ); 