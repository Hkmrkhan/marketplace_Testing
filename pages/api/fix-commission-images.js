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
    console.log('=== FIX COMMISSION IMAGES STARTED ===');

    // 1. Get all commission records with missing car_image_url
    console.log('Fetching commissions with missing images...');
    const { data: commissions, error: commissionsError } = await supabaseAdmin
      .from('admin_commissions')
      .select(`
        *,
        cars!inner(
          id,
          title,
          image_url,
          images
        )
      `)
      .is('car_image_url', null);

    if (commissionsError) {
      console.error('❌ Error fetching commissions:', commissionsError);
      return res.status(500).json({ error: 'Failed to fetch commissions' });
    }

    console.log(`Found ${commissions.length} commissions with missing images`);

    // 2. Process each commission and update image URL
    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (const commission of commissions) {
      try {
        console.log(`Processing commission ${commission.id} for car ${commission.car_id}`);
        console.log('Car data:', {
          carId: commission.car_id,
          title: commission.cars?.title,
          imageUrl: commission.cars?.image_url,
          images: commission.cars?.images,
          hasImages: !!commission.cars?.images,
          imagesLength: commission.cars?.images?.length || 0
        });

        // Get the best available image URL
        let carImageUrl = null;
        
        // First try image_url
        if (commission.cars?.image_url) {
          carImageUrl = commission.cars.image_url;
          console.log('Using image_url:', carImageUrl);
        } 
        // Then try images field
        else if (commission.cars?.images) {
          console.log('Images field type:', typeof commission.cars.images);
          console.log('Images field value:', commission.cars.images);
          
          if (Array.isArray(commission.cars.images) && commission.cars.images.length > 0) {
            carImageUrl = commission.cars.images[0];
            console.log('Using first image from array:', carImageUrl);
          } else if (typeof commission.cars.images === 'string') {
            // Try to parse JSON string
            try {
              const parsedImages = JSON.parse(commission.cars.images);
              console.log('Parsed images:', parsedImages);
              if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                carImageUrl = parsedImages[0];
                console.log('Using first parsed image:', carImageUrl);
              }
            } catch (e) {
              console.log('Failed to parse images string, using as is');
              // If parsing fails, check if it's a valid URL
              if (commission.cars.images.startsWith('http')) {
                carImageUrl = commission.cars.images;
                console.log('Using images string as URL:', carImageUrl);
              }
            }
          }
        }
        
        // If still no image, try to get from cars table directly
        if (!carImageUrl) {
          console.log('No image found in commission data, fetching from cars table...');
          try {
            const { data: carData, error: carError } = await supabaseAdmin
              .from('cars')
              .select('image_url, images')
              .eq('id', commission.car_id)
              .single();
            
            if (!carError && carData) {
              console.log('Car data from direct fetch:', carData);
              
              if (carData.image_url) {
                carImageUrl = carData.image_url;
                console.log('Using direct fetch image_url:', carImageUrl);
              } else if (carData.images) {
                if (Array.isArray(carData.images) && carData.images.length > 0) {
                  carImageUrl = carData.images[0];
                  console.log('Using direct fetch first image:', carImageUrl);
                } else if (typeof carData.images === 'string') {
                  try {
                    const parsedDirect = JSON.parse(carData.images);
                    if (Array.isArray(parsedDirect) && parsedDirect.length > 0) {
                      carImageUrl = parsedDirect[0];
                      console.log('Using direct fetch parsed image:', carImageUrl);
                    }
                  } catch (e) {
                    if (carData.images.startsWith('http')) {
                      carImageUrl = carData.images;
                      console.log('Using direct fetch images string as URL:', carImageUrl);
                    }
                  }
                }
              }
            }
          } catch (directError) {
            console.log('Direct fetch failed:', directError.message);
          }
        }

        console.log('Final image URL:', carImageUrl);

        if (carImageUrl) {
          // Update commission record with image URL
          const { error: updateError } = await supabaseAdmin
            .from('admin_commissions')
            .update({ car_image_url: carImageUrl })
            .eq('id', commission.id);

          if (updateError) {
            console.error(`❌ Failed to update commission ${commission.id}:`, updateError);
            errorCount++;
            results.push({
              commissionId: commission.id,
              status: 'failed',
              error: updateError.message
            });
          } else {
            console.log(`✅ Commission ${commission.id} updated with image: ${carImageUrl}`);
            successCount++;
            results.push({
              commissionId: commission.id,
              status: 'success',
              imageUrl: carImageUrl
            });
          }
        } else {
          console.log(`⚠️ No image found for commission ${commission.id}`);
          results.push({
            commissionId: commission.id,
            status: 'no_image',
            message: 'No image available for this car'
          });
        }

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing commission ${commission.id}:`, error);
        errorCount++;
        results.push({
          commissionId: commission.id,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log('=== FIX COMMISSION IMAGES COMPLETED ===');
    console.log(`Success: ${successCount}, Errors: ${errorCount}`);

    res.json({
      success: true,
      summary: {
        totalCommissions: commissions.length,
        successCount: successCount,
        errorCount: errorCount
      },
      results: results,
      message: `Image fix completed. ${successCount} commissions updated, ${errorCount} failed.`
    });

  } catch (error) {
    console.error('❌ Fix commission images error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to fix commission images'
    });
  }
}
