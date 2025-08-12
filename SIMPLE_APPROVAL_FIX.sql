-- Simple Approval Status Fix
-- Run this in Supabase SQL Editor

-- Add approval_status column to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Update existing cars to have approved status (so they continue showing)
UPDATE cars 
SET approval_status = 'approved' 
WHERE approval_status IS NULL OR approval_status = 'pending';

-- Create simple notification component for sellers
CREATE OR REPLACE FUNCTION notify_seller_approval_status()
RETURNS TRIGGER AS $$
BEGIN
    -- This will be handled by frontend notifications
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

