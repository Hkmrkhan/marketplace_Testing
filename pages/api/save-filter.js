import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, filter_name, filter_data } = req.body;

    if (!user_id || !filter_name || !filter_data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate filter_data is a proper object
    if (typeof filter_data !== 'object' || filter_data === null) {
      return res.status(400).json({ error: 'Invalid filter_data format' });
    }

    // Clean the filter data - remove empty values
    const cleanedFilterData = {};
    Object.keys(filter_data).forEach(key => {
      if (filter_data[key] !== '' && filter_data[key] !== null && filter_data[key] !== undefined) {
        cleanedFilterData[key] = filter_data[key];
      }
    });

    const { data, error } = await supabase
      .from('user_filters')
      .insert([
        {
          user_id: user_id,
          filter_name,
          filter_data: cleanedFilterData,
          is_default: false
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error saving filter:', error);
      return res.status(500).json({ 
        error: `Failed to save filter: ${error.message}`,
        user_id,
        filter_name,
        cleaned_data: cleanedFilterData
      });
    }

    res.status(200).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error in save-filter API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 