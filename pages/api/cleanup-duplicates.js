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
    console.log('=== CLEANUP DUPLICATE PURCHASES STARTED ===');

    // 1. Find duplicate purchases by car_id
    console.log('Finding duplicate purchases...');
    const { data: duplicates, error: duplicatesError } = await supabaseAdmin
      .from('purchases')
      .select('*')
      .order('car_id, created_at');

    if (duplicatesError) {
      console.error('❌ Error fetching purchases:', duplicatesError);
      return res.status(500).json({ error: 'Failed to fetch purchases' });
    }

    // Group by car_id to find duplicates
    const groupedByCar = {};
    duplicates.forEach(purchase => {
      if (!groupedByCar[purchase.car_id]) {
        groupedByCar[purchase.car_id] = [];
      }
      groupedByCar[purchase.car_id].push(purchase);
    });

    // Find cars with multiple purchases
    const carsWithDuplicates = Object.entries(groupedByCar)
      .filter(([carId, purchases]) => purchases.length > 1)
      .map(([carId, purchases]) => ({ carId, purchases }));

    console.log(`Found ${carsWithDuplicates.length} cars with duplicate purchases`);

    let cleanedCount = 0;
    let keptCount = 0;
    const results = [];

    // 2. Clean up duplicates
    for (const { carId, purchases } of carsWithDuplicates) {
      console.log(`Processing car ${carId} with ${purchases.length} purchases`);

      // Sort by creation date and keep the most recent one with seller_id
      const sortedPurchases = purchases.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      // Find the best purchase to keep (has seller_id and is most recent)
      const purchaseToKeep = sortedPurchases.find(p => p.seller_id) || sortedPurchases[0];
      const purchasesToDelete = sortedPurchases.filter(p => p.id !== purchaseToKeep.id);

      console.log(`Keeping purchase ${purchaseToKeep.id}, deleting ${purchasesToDelete.length} duplicates`);

      // Delete duplicate purchases
      for (const duplicate of purchasesToDelete) {
        const { error: deleteError } = await supabaseAdmin
          .from('purchases')
          .delete()
          .eq('id', duplicate.id);

        if (deleteError) {
          console.error(`❌ Failed to delete duplicate purchase ${duplicate.id}:`, deleteError);
          results.push({
            carId: carId,
            purchaseId: duplicate.id,
            status: 'failed_to_delete',
            error: deleteError.message
          });
        } else {
          console.log(`✅ Deleted duplicate purchase ${duplicate.id}`);
          cleanedCount++;
          results.push({
            carId: carId,
            purchaseId: duplicate.id,
            status: 'deleted'
          });
        }
      }

      keptCount++;
      results.push({
        carId: carId,
        purchaseId: purchaseToKeep.id,
        status: 'kept',
        reason: 'Best record (most recent with seller_id)'
      });
    }

    console.log('=== CLEANUP COMPLETED ===');
    console.log(`Cars processed: ${carsWithDuplicates.length}`);
    console.log(`Duplicates cleaned: ${cleanedCount}`);
    console.log(`Records kept: ${keptCount}`);

    res.json({
      success: true,
      summary: {
        carsWithDuplicates: carsWithDuplicates.length,
        duplicatesCleaned: cleanedCount,
        recordsKept: keptCount
      },
      results: results,
      message: `Cleanup completed. ${cleanedCount} duplicates removed, ${keptCount} records kept.`
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to cleanup duplicates'
    });
  }
}
