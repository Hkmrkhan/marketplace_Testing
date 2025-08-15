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
    const { userId } = req.body;

    console.log('=== FIX STRIPE BANK INFO STARTED ===');
    console.log('User ID:', userId);

    // Get user profile with stripe_account_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id, email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return res.status(400).json({ error: 'Profile not found' });
    }

    if (!profile.stripe_account_id) {
      console.error('No Stripe account found');
      return res.status(400).json({ error: 'No Stripe account found' });
    }

    console.log('Profile found:', {
      email: profile.email,
      fullName: profile.full_name,
      stripeAccountId: profile.stripe_account_id
    });

    // Check current Stripe account status
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    
    console.log('Current Stripe account status:', {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      transfers_enabled: account.capabilities?.transfers,
      requirements: account.requirements,
      business_type: account.business_type,
      country: account.country
    });

    // Check what's missing
    const missingRequirements = [];
    
    if (account.requirements?.currently_due?.length > 0) {
      missingRequirements.push(...account.requirements.currently_due);
    }
    
    if (account.requirements?.eventually_due?.length > 0) {
      missingRequirements.push(...account.requirements.eventually_due);
    }

    console.log('Missing requirements:', missingRequirements);

    // Generate new onboarding link for bank info
    console.log('Generating new onboarding link for bank info...');
    
    const accountLink = await stripe.accountLinks.create({
      account: profile.stripe_account_id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/seller-dashboard`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/seller-dashboard`,
      type: 'account_onboarding',
    });
    
    console.log('✅ New onboarding URL generated for bank info:', accountLink.url);

    res.status(200).json({
      success: true,
      url: accountLink.url,
      accountId: account.id,
      missingRequirements: missingRequirements,
      message: 'Bank info fix initiated successfully'
    });

  } catch (error) {
    console.error('❌ Fix bank info error:', error);
    res.status(500).json({ error: error.message });
  }
}
