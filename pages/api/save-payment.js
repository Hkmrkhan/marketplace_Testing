import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { carId, userId, amount, stripe_payment_id, status } = req.body;

  // 1. Insert payment record
  const { error: paymentError } = await supabase
    .from('payments')
    .insert([{ car_id: carId, user_id: userId, amount, stripe_payment_id, status }]);

  // 2. Mark car as sold
  const { error: carError } = await supabase
    .from('cars')
    .update({ status: 'sold' })
    .eq('id', carId);

  // 3. Add purchase record
  const { error: purchaseError } = await supabase
    .from('purchases')
    .insert([{ car_id: carId, buyer_id: userId }]);

  if (paymentError || carError || purchaseError) {
    return res.status(400).json({ error: paymentError?.message || carError?.message || purchaseError?.message });
  }

  res.status(200).json({ success: true });
} 