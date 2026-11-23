import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const stripeElementOptions = {
  style: {
    base: {
      fontSize: '15px',
      color: '#0f172a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontWeight: '500',
      lineHeight: '24px',
      '::placeholder': {
        color: '#94a3b8',
      },
      iconColor: '#6366f1',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

function CheckoutForm({ car, userId, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      console.log('=== PAYMENT START DEBUG ===');
      console.log('Car object:', car);
      console.log('Car price:', car?.price);
      console.log('Car ID:', car?.id);
      console.log('User ID:', userId);
      console.log('Cardholder:', cardholderName);
      console.log('=== END PAYMENT DEBUG ===');

      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car?.id,
          userId: userId,
        }),
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
        sellerAmount,
      });

      const cardNumberElement = elements.getElement(CardNumberElement);
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: cardholderName.trim() || undefined,
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        console.log('=== PAYMENT SUCCESS DEBUG ===');
        console.log('Payment Intent:', paymentIntent);
        console.log('Amount charged:', paymentIntent.amount / 100);
        console.log('Car price:', car?.price);
        console.log('=== END PAYMENT DEBUG ===');

        try {
          console.log('Making API call to /api/confirm-payment...');
          const confirmRes = await fetch('/api/confirm-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              carId: car?.id,
              userId: userId,
              amount: car?.price,
            }),
          });

          const confirmData = await confirmRes.json();
          if (confirmRes.ok) {
            console.log('Payment confirmed in database:', confirmData);
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

  const formattedPrice = Number(car?.price || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 text-left">
      
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Cardholder Name
        </label>
        <input
          type="text"
          placeholder="Name on card"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
          className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Card Number
        </label>
        <div className="bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white border border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-xl px-3.5 py-3 transition-all">
          <CardNumberElement options={{ ...stripeElementOptions, showIcon: true }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Expires
          </label>
          <div className="bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white border border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-xl px-3.5 py-3 transition-all">
            <CardExpiryElement options={stripeElementOptions} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            CVC / CVV
          </label>
          <div className="bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white border border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-xl px-3.5 py-3 transition-all">
            <CardCvcElement options={stripeElementOptions} />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl animate-in fade-in">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-none cursor-pointer"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <span>🔒 Pay ${formattedPrice} Securely</span>
            </>
          )}
        </button>
      </div>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer"
        >
          Cancel and return
        </button>
      )}

      <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium text-center">
        <span>🛡️ 256-Bit SSL Encrypted</span>
        <span>•</span>
        <span>Powered by Stripe</span>
        <span>•</span>
        <span>Buyer Protection</span>
      </div>
    </form>
  );
}

export default function StripeCheckoutModal({ car, userId, onSuccess, onCancel }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm car={car} userId={userId} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
} 