/**
 * Synchronized Car Image Fallback & Matching Utility
 * Ensures that broken, hotlink-blocked, or missing car images
 * seamlessly and gracefully display high-quality car assets
 * matching the car make/model across all dashboards.
 */

export function getFallbackCarImage(title = '') {
  const t = (title || '').toLowerCase().trim();
  
  if (t.includes('v8') || t.includes('land cruiser') || t.includes('cruiser')) {
    return '/v8.webp';
  }
  if (t.includes('xli') || t.includes('corolla') || t.includes('gli') || t.includes('toyota')) {
    return '/xli.webp';
  }
  if (t.includes('ferrari')) {
    return '/ferrari.webp';
  }
  if (t.includes('prado') || t.includes('parado')) {
    return '/carp4.webp';
  }
  if (t.includes('lamb') || t.includes('lambergini') || t.includes('lamborghini')) {
    return '/carp5.webp';
  }
  if (t.includes('sonata') || t.includes('audi') || t.includes('camry')) {
    return '/carp3.webp';
  }
  return '/carp2.webp';
}

export function getAllCarImages(car) {
  if (!car) return ['/carp2.webp'];
  
  const fallback = getFallbackCarImage(car.title || car.cars?.title);
  const images = [];

  const mainUrl = car.image_url || car.cars?.image_url;
  const additional = car.additional_images || car.cars?.additional_images;

  if (mainUrl && typeof mainUrl === 'string' && mainUrl.trim() !== '') {
    images.push(mainUrl.trim());
  }

  if (Array.isArray(additional)) {
    for (const img of additional) {
      if (img && typeof img === 'string' && img.trim() !== '' && !images.includes(img.trim())) {
        images.push(img.trim());
      }
    }
  }

  return images.length > 0 ? images : [fallback];
}

export function onImageErrorFallback(e, title = '') {
  const target = e.currentTarget;
  if (!target) return;
  const fallback = getFallbackCarImage(title);
  if (target.src !== fallback && !target.src.endsWith(fallback)) {
    target.onerror = null; // Prevent infinite loop if fallback fails
    target.src = fallback;
  }
}
