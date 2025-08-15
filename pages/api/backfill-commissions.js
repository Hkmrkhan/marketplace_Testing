import { createClient } from '@supabase/supabase-js';

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
    console.log('=== BACKFILL COMMISSIONS STARTED ===');

    // 1. Get all existing purchases without commission records
    console.log('Fetching all purchases...');
    const { data: purchases, error: purchasesError } = await supabaseAdmin
      .from('purchases')
      .select(`
        *,
        cars!inner(
          id,
          title,
          price,
          image_url,
          images,
          description
        )
      `)
      .order('purchase_date', { ascending: true });

    if (purchasesError) {
      console.error('❌ Error fetching purchases:', purchasesError);
      return res.status(500).json({ error: 'Failed to fetch purchases' });
    }

    console.log(`Found ${purchases.length} purchases to process`);

    // 2. Process each purchase and create commission records
    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (const purchase of purchases) {
      try {
        console.log(`Processing purchase ${purchase.id} for car ${purchase.car_id}`);
        console.log('Car data:', {
          carId: purchase.car_id,
          title: purchase.cars?.title,
          imageUrl: purchase.cars?.image_url,
          images: purchase.cars?.images,
          hasImages: !!purchase.cars?.images,
          imagesLength: purchase.cars?.images?.length || 0
        });

        // Check if commission already exists
        const { data: existingCommission } = await supabaseAdmin
          .from('admin_commissions')
          .select('id')
          .eq('sale_id', purchase.id)
          .single();

        if (existingCommission) {
          console.log(`Commission already exists for purchase ${purchase.id}, skipping...`);
          continue;
        }

        // Calculate commission (10%)
        const commissionAmount = Math.round(purchase.amount * 0.10 * 100) / 100; // Round to 2 decimal places

        // Get the best available image URL
        let carImageUrl = null;
        if (purchase.cars?.image_url) {
          carImageUrl = purchase.cars.image_url;
        } else if (purchase.cars?.images && purchase.cars.images.length > 0) {
          // If images is an array, get the first one
          if (Array.isArray(purchase.cars.images)) {
            carImageUrl = purchase.cars.images[0];
          } else if (typeof purchase.cars.images === 'string') {
            // If images is a string, try to parse it as JSON
            try {
              const parsedImages = JSON.parse(purchase.cars.images);
              if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                carImageUrl = parsedImages[0];
              }
            } catch (e) {
              // If parsing fails, use the string as is
              carImageUrl = purchase.cars.images;
            }
          }
        }

        console.log('Final image URL:', carImageUrl);

        // Create commission record
        const { data: commissionData, error: commissionError } = await supabaseAdmin
          .from('admin_commissions')
          .insert([{
            sale_id: purchase.id,
            car_id: purchase.car_id,
            car_title: purchase.cars?.title || 'Car Purchase',
            car_image_url: carImageUrl,
            car_price: purchase.amount,
            sale_amount: purchase.amount,
            commission_amount: commissionAmount,
            commission_rate: 10.00,
            buyer_id: purchase.buyer_id,
            buyer_name: 'Previous Buyer', // You can fetch actual names if needed
            seller_id: purchase.seller_id,
            seller_name: 'Previous Seller', // You can fetch actual names if needed
            sale_date: purchase.purchase_date,
            created_at: new Date().toISOString()
          }])
          .select();

        if (commissionError) {
          console.error(`❌ Failed to create commission for purchase ${purchase.id}:`, commissionError);
          errorCount++;
          results.push({
            purchaseId: purchase.id,
            status: 'failed',
            error: commissionError.message
          });
        } else {
          console.log(`✅ Commission created for purchase ${purchase.id}: $${commissionAmount}`);
          successCount++;
          results.push({
            purchaseId: purchase.id,
            status: 'success',
            commissionAmount: commissionAmount
          });
        }

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing purchase ${purchase.id}:`, error);
        errorCount++;
        results.push({
          purchaseId: purchase.id,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log('=== BACKFILL COMMISSIONS COMPLETED ===');
    console.log(`Success: ${successCount}, Errors: ${errorCount}`);

    res.json({
      success: true,
      summary: {
        totalPurchases: purchases.length,
        successCount: successCount,
        errorCount: errorCount
      },
      results: results,
      message: `Backfill completed. ${successCount} commissions created, ${errorCount} failed.`
    });

  } catch (error) {
    console.error('❌ Backfill error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to backfill commissions'
    });
  }
}
