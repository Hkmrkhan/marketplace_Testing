import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { car_id, rating, title, comment } = req.body;

    // Validate required fields
    if (!car_id || !rating || !title || !comment) {
      return res.status(400).json({ 
        error: 'Missing required fields: car_id, rating, title, comment' 
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }

    // Get authenticated user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if user already reviewed this car
    const { data: existingReview } = await supabase
      .from('car_reviews')
      .select('id')
      .eq('car_id', car_id)
      .eq('reviewer_id', user.id)
      .single();

    if (existingReview) {
      return res.status(400).json({ 
        error: 'You have already reviewed this car' 
      });
    }

    // Check if user has purchased this car (for verified purchase badge)
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('car_id', car_id)
      .eq('buyer_id', user.id)
      .single();

    // Create the review
    const { data: review, error: insertError } = await supabase
      .from('car_reviews')
      .insert({
        car_id,
        reviewer_id: user.id,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        verified_purchase: !!purchase
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating review:', insertError);
      return res.status(500).json({ error: 'Failed to create review' });
    }

    // Get the complete review with user info
    const { data: completeReview } = await supabase
      .from('car_reviews_with_users')
      .select('*')
      .eq('id', review.id)
      .single();

    res.status(201).json({ 
      success: true, 
      review: completeReview,
      message: 'Review created successfully' 
    });

  } catch (error) {
    console.error('Error in create review API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
