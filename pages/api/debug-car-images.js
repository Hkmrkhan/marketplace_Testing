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
    const { carId } = req.body;

    console.log('=== DEBUG CAR IMAGES STARTED ===');
    console.log('Car ID:', carId);

    // Get car details
    const { data: car, error: carError } = await supabaseAdmin
      .from('cars')
      .select('*')
      .eq('id', carId)
      .single();

    if (carError) {
      console.error('❌ Error fetching car:', carError);
      return res.status(500).json({ error: 'Failed to fetch car' });
    }

    console.log('Car data:', {
      id: car.id,
      title: car.title,
      image_url: car.image_url,
      images: car.images,
      imagesType: typeof car.images,
      hasImages: !!car.images,
      imagesLength: Array.isArray(car.images) ? car.images.length : 'Not array'
    });

    // Check if images is a string that needs parsing
    let parsedImages = null;
    if (typeof car.images === 'string') {
      try {
        parsedImages = JSON.parse(car.images);
        console.log('Parsed images:', parsedImages);
      } catch (e) {
        console.log('Failed to parse images string:', e.message);
      }
    }

    // Get the best available image URL
    let carImageUrl = null;
    if (car.image_url) {
      carImageUrl = car.image_url;
      console.log('Using image_url:', carImageUrl);
    } else if (car.images) {
      if (Array.isArray(car.images) && car.images.length > 0) {
        carImageUrl = car.images[0];
        console.log('Using first image from array:', carImageUrl);
      } else if (typeof car.images === 'string') {
        if (parsedImages && Array.isArray(parsedImages) && parsedImages.length > 0) {
          carImageUrl = parsedImages[0];
          console.log('Using first parsed image:', carImageUrl);
        } else {
          carImageUrl = car.images;
          console.log('Using images string as is:', carImageUrl);
        }
      }
    }

    console.log('Final image URL:', carImageUrl);

    res.json({
      success: true,
      car: {
        id: car.id,
        title: car.title,
        image_url: car.image_url,
        images: car.images,
        parsedImages: parsedImages,
        finalImageUrl: carImageUrl
      }
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ error: error.message });
  }
}
