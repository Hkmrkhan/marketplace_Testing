import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ car, userId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('=== PAYMENT START DEBUG ===');
      console.log('Car object:', car);
      console.log('Car price:', car.price);
      console.log('Car ID:', car.id);
      console.log('User ID:', userId);
      console.log('=== END PAYMENT DEBUG ===');

    // 1. Create payment intent from API
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          carId: car.id, 
          userId: userId 
        })
    });
      
      const { clientSecret, error: apiError, adminCommission, sellerAmount } = await res.json();
    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

      console.log('Payment Intent Created:', {
        clientSecret: clientSecret ? '✅ Received' : '❌ Missing',
        adminCommission,
        sellerAmount
      });

    // 2. Confirm card payment
    const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) }
    });

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

      if (paymentIntent.status === 'succeeded') {
        // 3. Payment successful - now confirm in backend
        console.log('=== PAYMENT SUCCESS DEBUG ===');
        console.log('Payment Intent:', paymentIntent);
        console.log('Amount charged:', paymentIntent.amount / 100);
        console.log('Car price:', car.price);
        console.log('=== END PAYMENT DEBUG ===');
        
        try {
          console.log('Making API call to /api/confirm-payment...');
          console.log('API call data:', {
            paymentIntentId: paymentIntent.id,
            carId: car.id,
            userId: userId,
            amount: car.price
          });
          
          const confirmRes = await fetch('/api/confirm-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              carId: car.id,
              userId: userId,
              amount: car.price
            })
          });

          console.log('API Response Status:', confirmRes.status);
          
          const confirmData = await confirmRes.json();
          console.log('API Response Data:', confirmData);
          
          if (confirmRes.ok) {
            console.log('Payment confirmed in database:', confirmData);
            // 4. Call onSuccess with paymentIntent
    onSuccess(paymentIntent);
          } else {
            console.error('Payment confirmation failed:', confirmData.error);
            setError('Payment succeeded but failed to update database: ' + confirmData.error);
          }
        } catch (confirmError) {
          console.error('Payment confirmation error:', confirmError);
          setError('Payment succeeded but failed to update database: ' + confirmError.message);
        }
      } else {
        setError('Payment failed. Please try again.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Payment error:', error);
      setError('An unexpected error occurred. Please try again.');
    setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading} style={{ marginTop: 16 }}>
        {loading ? 'Processing...' : `Pay $${car.price.toFixed(2)}`}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </form>
  );
}

export default function StripeCheckoutModal({ car, userId, onSuccess }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm car={car} userId={userId} onSuccess={onSuccess} />
    </Elements>
  );
} 