import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filter_id, user_id } = req.body;

    if (!filter_id || !user_id) {
      return res.status(400).json({ error: 'Filter ID and User ID are required' });
    }

    const { error } = await supabase
      .from('user_filters')
      .delete()
      .eq('id', filter_id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error deleting filter:', error);
      return res.status(500).json({ error: 'Failed to delete filter' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in delete-filter API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 