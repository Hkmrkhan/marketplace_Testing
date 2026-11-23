import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { car_id } = req.query;
    console.log('🔍 Reviews API called with car_id:', car_id);

    if (!car_id) {
      return res.status(400).json({ error: 'car_id is required' });
    }

    console.log('📊 Testing database connection...');
    
    const { data: testData, error: testError } = await supabase
      .from('car_reviews')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection test failed:', testError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: testError.message 
      });
    }
    
    console.log('✅ Database connection successful');

    console.log('📖 Fetching reviews for car_id:', car_id);
    const { data: reviews, error: reviewsError } = await supabase
      .from('car_reviews_with_users')
      .select('*')
      .eq('car_id', car_id)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('❌ Error fetching reviews:', reviewsError);
      return res.status(500).json({ 
        error: 'Failed to fetch reviews',
        details: reviewsError.message 
      });
    }

    console.log('✅ Reviews fetched successfully:', reviews?.length || 0, 'reviews');

    console.log('📊 Fetching review stats for car_id:', car_id);
    const { data: stats, error: statsError } = await supabase
      .from('car_review_stats')
      .select('*')
      .eq('car_id', car_id)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('⚠️ Error fetching review stats:', statsError);
      console.log('⚠️ This is not critical, continuing with default stats');
    }

    const defaultStats = {
      total_reviews: reviews?.length || 0,
      average_rating: 0,
      five_star_count: 0,
      four_star_count: 0,
      three_star_count: 0,
      two_star_count: 0,
      one_star_count: 0
    };

    if (stats) {
      console.log('✅ Review stats fetched successfully');
    } else {
      console.log('📊 Calculating stats manually from reviews');
      if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        defaultStats.average_rating = totalRating / reviews.length;
        defaultStats.total_reviews = reviews.length;
        
        reviews.forEach(review => {
          if (review.rating === 5) defaultStats.five_star_count++;
          else if (review.rating === 4) defaultStats.four_star_count++;
          else if (review.rating === 3) defaultStats.three_star_count++;
          else if (review.rating === 2) defaultStats.two_star_count++;
          else if (review.rating === 1) defaultStats.one_star_count++;
        });
      }
    }

    console.log('🎯 Sending response with:', {
      reviewsCount: reviews?.length || 0,
      stats: stats || defaultStats
    });

    res.status(200).json({ 
      success: true, 
      reviews: reviews || [],
      stats: stats || defaultStats
    });

  } catch (error) {
    console.error('❌ Error in get reviews API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
