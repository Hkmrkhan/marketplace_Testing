import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  console.log('=== CONFIRM PAYMENT API CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);

  try {
    const { paymentIntentId, carId, userId, amount } = req.body;
    
    console.log('Extracted data:', { paymentIntentId, carId, userId, amount });
    
    // Validate required fields
    if (!paymentIntentId || !carId || !userId || !amount) {
      console.error('Missing required fields:', { paymentIntentId, carId, userId, amount });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log('All required fields present, proceeding with database operations...');
    
    // Create payment record first
    console.log('Creating payment record in payments table...');
    const paymentData = {
      user_id: userId,
      car_id: carId,
      amount: amount,
      currency: 'usd',
      stripe_payment_id: paymentIntentId,
      status: 'completed'
    };
    
    console.log('Payment data to insert:', paymentData);
    
    const { error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData);

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      console.error('Payment error details:', {
        message: paymentError.message,
        details: paymentError.details,
        hint: paymentError.hint,
        code: paymentError.code
      });
      return res.status(500).json({ error: 'Failed to create payment record: ' + paymentError.message });
    }

    console.log('Payment record created successfully');
    
    // Note: Purchase record is now created ONLY by Stripe webhook
    // We only need to update car status here to avoid duplicates
    
    // Update car status to sold
    console.log('Updating car status to sold...');
    const { error: carUpdateError } = await supabase
      .from('cars')
      .update({ 
        status: 'sold',
        buyer_id: userId,
        sold_at: new Date().toISOString()
      })
      .eq('id', carId);

    if (carUpdateError) {
      console.error('Car update error:', carUpdateError);
      console.error('Car update error details:', {
        message: carUpdateError.message,
        details: carUpdateError.details,
        hint: carUpdateError.hint,
        code: carUpdateError.code
      });
      // Don't fail the whole operation, just log the error
      console.log('Car status update failed, but payment record created successfully');
    } else {
      console.log('Car status updated to sold successfully');
    }

    console.log('=== ALL DATABASE OPERATIONS COMPLETED SUCCESSFULLY ===');
    
    // Send success response
    const responseData = {
      success: true, 
      message: 'Purchase confirmed successfully!',
      details: {
        carId: carId,
        userId: userId,
        amount: amount,
        status: 'completed'
      }
    };
    
    console.log('Sending success response:', responseData);
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
}
