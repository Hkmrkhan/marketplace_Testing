import { buffer } from 'micro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('=== STRIPE WEBHOOK RECEIVED ===');
  console.log('Event type:', event.type);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
      
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  console.log('=== PAYMENT SUCCEEDED HANDLER ===');
  console.log('Payment Intent:', paymentIntent.id);
  console.log('Metadata:', paymentIntent.metadata);

  const { carId, userId, sellerId, adminCommission, sellerAmount } = paymentIntent.metadata;

  try {
    // 1. Create purchase record
    console.log('Creating purchase record...');
    
    // Check if purchase already exists to prevent duplicates
    const { data: existingPurchase } = await supabaseAdmin
      .from('purchases')
      .select('id')
      .eq('car_id', carId)
      .single();

    if (existingPurchase) {
      console.log('Purchase already exists for this car, skipping purchase creation');
      console.log('Existing purchase ID:', existingPurchase.id);
    } else {
      // Get car details to fetch seller_id
      const { data: carDetails, error: carError } = await supabaseAdmin
        .from('cars')
        .select('seller_id')
        .eq('id', carId)
        .single();

      if (carError) {
        console.error('❌ Failed to fetch car details:', carError);
        throw carError;
      }

      const sellerId = carDetails?.seller_id || sellerId; // Use from metadata if car doesn't have it

      const { data: purchaseData, error: purchaseError } = await supabaseAdmin
        .from('purchases')
        .insert([{
          car_id: carId,
          buyer_id: userId,
          seller_id: sellerId,
          amount: parseFloat(paymentIntent.amount) / 100,
          purchase_date: new Date().toISOString()
        }])
        .select();

      if (purchaseError) {
        console.error('❌ Purchase creation failed:', purchaseError);
        throw purchaseError;
      }

      console.log('✅ Purchase record created:', purchaseData);
    }

    // 2. Update car status to sold
    console.log('Updating car status to sold...');
    const { error: carUpdateError } = await supabaseAdmin
      .from('cars')
      .update({
        status: 'sold',
        buyer_id: userId,
        sold_at: new Date().toISOString()
      })
      .eq('id', carId);

    if (carUpdateError) {
      console.error('❌ Car status update failed:', carUpdateError);
      throw carUpdateError;
    }

    console.log('✅ Car status updated to sold');

    // 3. Create admin commission record
    console.log('Creating admin commission record...');
    const { data: commissionData, error: commissionError } = await supabaseAdmin
      .from('admin_commissions')
      .insert([{
        sale_id: purchaseData[0].id,
        car_id: carId,
        car_title: 'Car Purchase', // You can fetch actual car title if needed
        car_price: parseFloat(paymentIntent.amount) / 100,
        sale_amount: parseFloat(paymentIntent.amount) / 100,
        commission_amount: parseFloat(adminCommission),
        commission_rate: 10.00,
        buyer_id: userId,
        buyer_name: 'Buyer', // You can fetch actual buyer name if needed
        seller_id: sellerId,
        seller_name: 'Seller', // You can fetch actual seller name if needed
        sale_date: new Date().toISOString()
      }])
      .select();

    if (commissionError) {
      console.error('❌ Admin commission creation failed:', commissionError);
      throw commissionError;
    }

    console.log('✅ Admin commission record created:', commissionData);

    console.log('=== PAYMENT SUCCEEDED HANDLER COMPLETED ===');

  } catch (error) {
    console.error('❌ Payment succeeded handler error:', error);
    throw error;
  }
}

async function handleTransferCreated(transfer) {
  console.log('=== TRANSFER CREATED HANDLER ===');
  console.log('Transfer ID:', transfer.id);
  console.log('Amount:', transfer.amount);
  console.log('Destination:', transfer.destination);
  
  // Log transfer details for monitoring
  console.log('✅ Transfer logged successfully');
}

async function handleAccountUpdated(account) {
  console.log('=== ACCOUNT UPDATED HANDLER ===');
  console.log('Account ID:', account.id);
  console.log('Status:', account.charges_enabled);
  
  // You can update profile status here if needed
  if (account.charges_enabled) {
    console.log('✅ Account is now ready to receive payments');
  }
}

