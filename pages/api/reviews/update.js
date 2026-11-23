import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { review_id, rating, title, comment } = req.body;

    if (!review_id || !rating || !title || !comment) {
      return res.status(400).json({ 
        error: 'Missing required fields: review_id, rating, title, comment' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { data: existingReview, error: fetchError } = await supabase
      .from('car_reviews')
      .select('*')
      .eq('id', review_id)
      .single();

    if (fetchError || !existingReview) {
      return res.status(404).json({ 
        error: 'Review not found' 
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to verify user permissions' });
    }

    if (existingReview.reviewer_id !== user.id && profile.user_type !== 'admin') {
      return res.status(403).json({ 
        error: 'You do not have permission to edit this review' 
      });
    }

    const updateQuery = supabase
      .from('car_reviews')
      .update({
        rating,
        title: title.trim(),
        comment: comment.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', review_id);

    if (profile.user_type !== 'admin') {
      updateQuery.eq('reviewer_id', user.id);
    }

    const { data: updatedReview, error: updateError } = await updateQuery.select().single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return res.status(500).json({ error: 'Failed to update review' });
    }

    const { data: completeReview } = await supabase
      .from('car_reviews_with_users')
      .select('*')
      .eq('id', review_id)
      .single();

    res.status(200).json({ 
      success: true, 
      review: completeReview,
      message: 'Review updated successfully' 
    });

  } catch (error) {
    console.error('Error in update review API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
