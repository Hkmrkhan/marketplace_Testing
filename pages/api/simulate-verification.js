import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accountId } = req.body;

    console.log('=== SIMULATING STRIPE VERIFICATION ===');
    console.log('Account ID:', accountId);

    // In test mode, we can simulate account verification
    const updatedAccount = await stripe.accounts.update(accountId, {
      // Simulate business verification
      business_profile: {
        url: 'https://testseller.com',
        mcc: '5734', // Computer Software Stores
        product_description: 'Car marketplace seller'
      },
      
      // Simulate external account (bank account)
      external_accounts: {
        object: 'bank_account',
        country: 'US',
        currency: 'usd',
        account_holder_type: 'individual',
        account_holder_name: 'Test Seller',
        routing_number: '110000000',
        account_number: '000123456789'
      },
      
      // Simulate representative verification
      individual: {
        first_name: 'Test',
        last_name: 'Seller',
        email: 'test@seller.com',
        dob: {
          day: 1,
          month: 1,
          year: 1990
        },
        ssn_last_4: '0000',
        address: {
          line1: '123 Test Street',
          city: 'Test City',
          state: 'TX',
          postal_code: '12345',
          country: 'US'
        },
        phone: '+15551234567',
        verification: {
          document: {
            front: 'file_1234567890' // You can upload a test document
          }
        }
      },
      
      // Enable capabilities
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true }
      }
    });

    console.log('✅ Account updated successfully:', updatedAccount.id);
    console.log('Account status:', updatedAccount.charges_enabled);
    console.log('Capabilities:', updatedAccount.capabilities);

    res.json({
      success: true,
      accountId: updatedAccount.id,
      chargesEnabled: updatedAccount.charges_enabled,
      capabilities: updatedAccount.capabilities,
      message: 'Account verification simulated successfully'
    });

  } catch (error) {
    console.error('❌ Verification simulation failed:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to simulate verification'
    });
  }
}
