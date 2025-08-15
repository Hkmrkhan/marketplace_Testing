import { supabase } from "../../../utils/supabaseClient";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userEmail, country = 'US' } = req.body;

    console.log('=== SELLER REGISTRATION STARTED ===');
    console.log('Request data:', { userId, userEmail, country });

    // 1. Verify user exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, user_type')
      .eq('id', userId)
      .single();

    if (profileError || !existingProfile) {
      console.error('Profile verification failed:', profileError);
      return res.status(400).json({ error: 'User profile not found' });
    }

    console.log('Profile verified:', existingProfile);

    // 2. Create Stripe Connect Express Account
    console.log('Creating Stripe Connect account...');
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: userEmail,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true }
      },
      business_type: 'individual'
    });

    console.log('✅ Stripe account created:', account.id);

    // 3. Update profile with stripe_account_id and user_type
    console.log('Updating profile...');
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        stripe_account_id: account.id,
        user_type: 'seller'
      })
      .eq('id', userId)
      .select('id, stripe_account_id, user_type');

    if (updateError) {
      console.error('❌ Profile update failed:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update profile',
        details: updateError.message 
      });
    }

    console.log('✅ Profile updated:', updateData);

    // 4. Create onboarding link
    console.log('Generating onboarding link...');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reauth`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/seller-dashboard`,
      type: 'account_onboarding'
    });

    console.log('✅ Onboarding link generated:', accountLink.url);

    console.log('=== SELLER REGISTRATION COMPLETED ===');

    res.status(200).json({ 
      success: true,
      url: accountLink.url,
      accountId: account.id,
      message: 'Seller account created successfully'
    });

  } catch (err) {
    console.error('❌ Seller registration error:', err);
    res.status(500).json({ 
      error: err.message,
      details: 'Failed to create seller account'
    });
  }
}
