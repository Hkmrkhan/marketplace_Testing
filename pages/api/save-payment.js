import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { carId, userId, amount, stripe_payment_id, status, sellerId } = req.body;

  // 1. Mark car as sold
  const { error: carError } = await supabase
    .from('cars')
    .update({ status: 'sold' })
    .eq('id', carId);

  if (carError) {
    return res.status(400).json({ error: carError.message });
  }

  // 2. Insert purchase record (fields table ke hisaab se adjust karo)
  const { data: purchaseData, error: purchaseError } = await supabase
    .from('purchases')
    .insert([{
      car_id: carId,
      buyer_id: userId,
      seller_id: sellerId,
      amount,
      purchase_date: new Date().toISOString()
    }])
    .select();

  if (purchaseError) {
    return res.status(400).json({ error: purchaseError.message });
  }

  res.status(200).json({ success: true, purchase: purchaseData });
} 