import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { carId, userId } = req.body;

    console.log('=== PAYMENT INTENT CREATION STARTED ===');
    console.log('Request data:', { carId, userId });

    // Fetch car details including seller information
    const { data: car, error: carError } = await supabaseAdmin
      .from('cars')
      .select(`
        *,
        profiles!inner(*)
      `)
      .eq('id', carId)
      .single();

    if (carError || !car) {
      console.error('Car fetch error:', carError);
      return res.status(400).json({ error: 'Car not found' });
    }

    console.log('Car details fetched:', { 
      carId: car.id, 
      price: car.price, 
      priceType: typeof car.price,
      sellerId: car.seller_id,
      sellerStripeId: car.profiles?.stripe_account_id 
    });

    // Validate car price
    if (!car.price || car.price <= 0) {
      console.error('Invalid car price:', car.price);
      return res.status(400).json({ error: 'Invalid car price' });
    }

    // Check if seller has Stripe account
    if (!car.profiles?.stripe_account_id) {
      console.error('Seller has no Stripe account');
      return res.status(400).json({ error: 'Seller payment setup incomplete' });
    }

    // Verify seller account capabilities
    try {
      const sellerAccount = await stripe.accounts.retrieve(car.profiles.stripe_account_id);
      console.log('Seller account details:', {
        id: sellerAccount.id,
        charges_enabled: sellerAccount.charges_enabled,
        transfers_enabled: sellerAccount.capabilities?.transfers === 'active',
        account_type: sellerAccount.type
      });
      
      if (!sellerAccount.capabilities?.transfers || sellerAccount.capabilities.transfers !== 'active') {
        console.error('Seller account transfers capability not active');
        return res.status(400).json({ 
          error: 'Seller account not ready for transfers. Please complete Stripe setup.' 
        });
      }
    } catch (accountError) {
      console.error('Error retrieving seller account:', accountError);
      return res.status(400).json({ 
        error: 'Unable to verify seller account. Please try again.' 
      });
    }

    const priceInCents = Math.round(car.price * 100);
    const adminCommission = Math.round(priceInCents * 0.10); // 10% admin commission
    const sellerAmount = priceInCents - adminCommission; // 90% to seller

    console.log('Payment breakdown:', {
      originalPrice: car.price,
      priceInCents: priceInCents,
      adminCommission: adminCommission,
      adminCommissionDollars: adminCommission / 100,
      sellerAmount: sellerAmount,
      sellerAmountDollars: sellerAmount / 100,
      total: priceInCents / 100
    });

    // Create payment intent with admin commission and transfer to seller
    const paymentIntent = await stripe.paymentIntents.create({
      amount: priceInCents,
      currency: 'usd',
      application_fee_amount: adminCommission, // 10% admin commission
      transfer_data: {
        destination: car.profiles.stripe_account_id, // Transfer to seller's account
      },
      metadata: {
        carId: carId,
        userId: userId,
        sellerId: car.seller_id,
        adminCommission: adminCommission / 100, // Store in dollars
        sellerAmount: sellerAmount / 100 // Store in dollars
      }
    });

    console.log('✅ Payment intent created:', paymentIntent.id);

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      adminCommission: adminCommission / 100, // Return in dollars
      sellerAmount: sellerAmount / 100 // Return in dollars
    });

  } catch (error) {
    console.error('❌ Payment intent creation error:', error);
    res.status(500).json({ error: error.message });
  }
} 






