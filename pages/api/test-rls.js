import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple user ID for testing (UUID format)
    const testUserId = '123e4567-e89b-12d3-a456-426614174000';

    // Test 1: Try to insert a test record
    const testData = {
      user_id: testUserId,
      filter_name: 'Test Filter',
      filter_data: { title: 'test' },
      is_default: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('user_filters')
      .insert([testData])
      .select();

    if (insertError) {
      return res.status(500).json({ 
        error: 'RLS Insert Test Failed', 
        details: insertError.message,
        user_id: testUserId,
        test_data: testData
      });
    }

    // Test 2: Try to select the test record
    const { data: selectData, error: selectError } = await supabase
      .from('user_filters')
      .select('*')
      .eq('user_id', testUserId);

    if (selectError) {
      return res.status(500).json({ 
        error: 'RLS Select Test Failed', 
        details: selectError.message,
        user_id: testUserId
      });
    }

    // Clean up test data
    if (insertData && insertData[0]) {
      await supabase
        .from('user_filters')
        .delete()
        .eq('id', insertData[0].id);
    }

    res.status(200).json({ 
      success: true, 
      message: 'RLS policies are working correctly (Authentication Bypass)',
      user: {
        id: testUserId,
        type: 'simple_user'
      },
      test_result: 'Insert and select operations successful',
      policies: 'Authentication bypass policies active'
    });

  } catch (error) {
    console.error('Test RLS error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
} 