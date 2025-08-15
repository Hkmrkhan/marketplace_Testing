import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Check if Stripe secret key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set');
}

// Check if service role key is available
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, userEmail, country = 'US' } = req.body;

  console.log('=== STRIPE ACCOUNT CREATION STARTED ===');
  console.log('Request data:', { userId, userEmail, country });
  console.log('STRIPE_SECRET_KEY available:', !!process.env.STRIPE_SECRET_KEY);
  console.log('SUPABASE_SERVICE_ROLE_KEY available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // First, verify user exists in profiles table using admin client
    console.log('Verifying user exists in profiles table...');
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, user_type')
      .eq('id', userId)
      .single();

    if (profileError || !existingProfile) {
      console.error('Profile verification failed:', profileError);
      return res.status(400).json({ error: 'User profile not found' });
    }

    console.log('Profile verified:', existingProfile);

    // Create Stripe Connect Express Account
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

    console.log('✅ Stripe account created successfully:', {
      accountId: account.id,
      accountType: account.type,
      country: account.country,
      email: account.email
    });

    // Generate onboarding link
    console.log('Generating onboarding link...');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reauth`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/seller-dashboard`,
      type: 'account_onboarding'
    });

    console.log('✅ Onboarding link generated:', accountLink.url);

    // Update profile with Stripe account ID using admin client
    console.log('Updating profile with Stripe account ID...');
    console.log('Update data:', { 
      stripe_account_id: account.id,
      userId: userId 
    });

    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        stripe_account_id: account.id
      })
      .eq('id', userId)
      .select('id, stripe_account_id');

    if (updateError) {
      console.error('❌ Profile update failed:', updateError);
      console.error('Update error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
      return res.status(500).json({ 
        error: 'Failed to update profile',
        details: updateError.message 
      });
    }

    console.log('✅ Profile updated successfully:', updateData);

    // Verify the update was successful
    console.log('Verifying profile update...');
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('profiles')
      .select('id, stripe_account_id')
      .eq('id', userId)
      .single();

    if (verifyError) {
      console.error('❌ Profile verification after update failed:', verifyError);
    } else {
      console.log('✅ Profile verification after update:', verifyData);
      console.log('Stripe account ID saved:', verifyData.stripe_account_id);
    }

    console.log('=== STRIPE ACCOUNT CREATION COMPLETED SUCCESSFULLY ===');

    res.status(200).json({ 
      accountId: account.id,
      onboardingUrl: accountLink.url,
      status: 'pending',
      profileUpdated: true
    });

  } catch (err) {
    console.error('❌ Stripe account creation error:', err);
    console.error('Error details:', {
      message: err.message,
      type: err.type,
      code: err.code
    });
    res.status(400).json({ error: err.message });
  }
}
