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

    // 1. Create payment intent from API
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: car.price, carId: car.id, userId })
    });
    const { clientSecret, error: apiError } = await res.json();
    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    // 2. Confirm card payment
    const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) }
    });

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    // 3. On success, call onSuccess with paymentIntent
    onSuccess(paymentIntent);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading} style={{ marginTop: 16 }}>
        {loading ? 'Processing...' : `Pay $${car.price}`}
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