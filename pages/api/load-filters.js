import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id } = req.query;
    console.log('🔍 Load filters API called with user_id:', user_id);

    if (!user_id) {
      console.log('⚠️ No user_id provided, returning empty filters');
      return res.status(200).json({ 
        success: true, 
        data: [],
        message: 'No user ID provided, returning empty filters'
      });
    }

    // Check if user_filters table exists
    console.log('📊 Checking if user_filters table exists...');
    
    try {
      const { data, error } = await supabase
        .from('user_filters')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error loading filters:', error);
        
        // If table doesn't exist, return empty filters instead of error
        if (error.code === '42P01') { // Table doesn't exist
          console.log('⚠️ user_filters table does not exist, returning empty filters');
          return res.status(200).json({ 
            success: true, 
            data: [],
            message: 'Filters table not found, returning empty filters'
          });
        }
        
        return res.status(500).json({ 
          error: `Failed to load filters: ${error.message}`,
          details: error
        });
      }

      console.log('✅ Filters loaded successfully:', data?.length || 0, 'filters');
      res.status(200).json({ success: true, data: data || [] });
      
    } catch (tableError) {
      console.error('❌ Error accessing user_filters table:', tableError);
      
      // Return empty filters instead of error
      console.log('⚠️ Returning empty filters due to table access error');
      res.status(200).json({ 
        success: true, 
        data: [],
        message: 'Unable to access filters, returning empty filters'
      });
    }

  } catch (error) {
    console.error('❌ Error in load-filters API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
} 