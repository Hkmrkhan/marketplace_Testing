import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { data, error } = await supabase
      .from('user_filters')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error loading filters:', error);
      return res.status(500).json({ error: `Failed to load filters: ${error.message}` });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in load-filters API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 