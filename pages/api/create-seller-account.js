import Stripe from "stripe";
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
    const { userId, email, country = 'US' } = req.body;

    console.log('=== SELLER ACCOUNT CREATION STARTED ===');
    console.log('Request data:', { userId, email, country });

    // 1. Create Express account
    console.log('Creating Stripe Connect Express account...');
    let account;
    
    try {
      // Try Express account first
      account = await stripe.accounts.create({
        type: "express",
        country: country,
        email: email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
          card_issuing: { requested: false },
          tax_reporting_us_1099_k: { requested: false }
        },
        business_type: 'individual',
        business_profile: {
          url: 'https://example.com',
          mcc: '5734' // Computer Software Stores
        }
      });
      
      console.log('✅ Stripe Connect Express account created:', account.id);
    } catch (expressError) {
      console.log('⚠️ Express account creation failed, trying Custom account...');
      console.log('Express error:', expressError.message);
      
      // Fallback to Custom account
      account = await stripe.accounts.create({
        type: "custom",
        country: country,
        email: email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true }
        },
        business_type: 'individual',
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        }
      });
      
      console.log('✅ Stripe Connect Custom account created:', account.id);
    }

    // 2. Save stripe_account_id in profiles using admin client
    console.log('Updating profile with stripe_account_id...');
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        stripe_account_id: account.id,
        user_type: 'seller'
      })
      .eq("id", userId)
      .select('id, stripe_account_id, user_type');

    if (updateError) {
      console.error('❌ Profile update failed:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update profile',
        details: updateError.message 
      });
    }

    console.log('✅ Profile updated successfully:', updateData);

    // 3. Create onboarding link
    console.log('Generating onboarding link...');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/seller-onboarding`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/seller-dashboard`,
      type: "account_onboarding",
    });

    console.log('✅ Onboarding link generated:', accountLink.url);

    console.log('=== SELLER ACCOUNT CREATION COMPLETED ===');

    res.json({ 
      success: true,
      url: accountLink.url,
      accountId: account.id,
      message: 'Seller account created successfully'
    });

  } catch (err) {
    console.error('❌ Seller account creation error:', err);
    res.status(500).json({ 
      error: err.message,
      details: 'Failed to create seller account'
    });
  }
}
