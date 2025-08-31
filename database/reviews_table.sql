-- Reviews Table for Marketplace Cars

-- Create reviews table
CREATE TABLE IF NOT EXISTS car_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    title VARCHAR(200) NOT NULL,
    comment TEXT NOT NULL,
    verified_purchase BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one review per user per car
    UNIQUE(car_id, reviewer_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_car_reviews_car_id ON car_reviews(car_id);
CREATE INDEX IF NOT EXISTS idx_car_reviews_reviewer_id ON car_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_car_reviews_rating ON car_reviews(rating);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_car_reviews_updated_at 
    BEFORE UPDATE ON car_reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE car_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" ON car_reviews
    FOR SELECT USING (true);

-- Only authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews" ON car_reviews
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() = reviewer_id
    );

-- Users can only update their own reviews
CREATE POLICY "Users can update own reviews" ON car_reviews
    FOR UPDATE USING (
        auth.uid() = reviewer_id
    );

-- Users can only delete their own reviews
CREATE POLICY "Users can delete own reviews" ON car_reviews
    FOR DELETE USING (
        auth.uid() = reviewer_id
    );

-- Create view for reviews with user information
CREATE OR REPLACE VIEW car_reviews_with_users AS
SELECT 
    cr.id,
    cr.car_id,
    cr.reviewer_id,
    cr.rating,
    cr.title,
    cr.comment,
    cr.verified_purchase,
    cr.helpful_votes,
    cr.created_at,
    cr.updated_at,
    p.full_name as reviewer_name,
    p.avatar_url as reviewer_avatar,
    p.user_type as reviewer_type
FROM car_reviews cr
JOIN profiles p ON cr.reviewer_id = p.id
ORDER BY cr.created_at DESC;

-- Create view for car review statistics
CREATE OR REPLACE VIEW car_review_stats AS
SELECT 
    car_id,
    COUNT(*) as total_reviews,
    AVG(rating) as average_rating,
    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count
FROM car_reviews
GROUP BY car_id;
