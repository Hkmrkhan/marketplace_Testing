import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing database connection...');

    // Test 1: Check if car_reviews table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('car_reviews')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('❌ Table check failed:', tableError);
      return res.status(500).json({ 
        error: 'Database table check failed',
        details: tableError.message 
      });
    }

    console.log('✅ car_reviews table exists');

    // Test 2: Check if views exist
    const { data: viewCheck, error: viewError } = await supabase
      .from('car_reviews_with_users')
      .select('id')
      .limit(1);

    if (viewError) {
      console.error('❌ View check failed:', viewError);
      return res.status(500).json({ 
        error: 'Database view check failed',
        details: viewError.message 
      });
    }

    console.log('✅ car_reviews_with_users view exists');

    // Test 3: Check if stats view exists
    const { data: statsCheck, error: statsError } = await supabase
      .from('car_review_stats')
      .select('car_id')
      .limit(1);

    if (statsError) {
      console.error('❌ Stats view check failed:', statsError);
      return res.status(500).json({ 
        error: 'Database stats view check failed',
        details: statsError.message 
      });
    }

    console.log('✅ car_review_stats view exists');

    // Test 4: Check total reviews count
    const { count: totalReviews, error: countError } = await supabase
      .from('car_reviews')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Count check failed:', countError);
      return res.status(500).json({ 
        error: 'Database count check failed',
        details: countError.message 
      });
    }

    console.log('✅ Total reviews count:', totalReviews);

    res.status(200).json({ 
      success: true, 
      message: 'Database connection successful!',
      totalReviews: totalReviews || 0,
      tables: ['car_reviews', 'car_reviews_with_users', 'car_review_stats']
    });

  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({ 
      error: 'Database test failed',
      details: error.message 
    });
  }
}

