import { useState } from 'react';
import styles from '../styles/CarCard.module.css';

export default function CarCard({ car }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Combine primary image with additional images
  const allImages = [];
  if (car.image_url && car.image_url.trim() !== '') {
    allImages.push(car.image_url);
  }
  if (car.additional_images && Array.isArray(car.additional_images)) {
    allImages.push(...car.additional_images.filter(img => img && img.trim() !== ''));
  }
  const imageSrc = allImages.length > 0 
    ? allImages[currentImageIndex] 
    : (car.image && car.image.trim() !== '' ? car.image : '/carp2.png');

  return (
    <div className={styles.card}>
      <div className={styles.carImageWrapper}>
        <img src={imageSrc} alt={car.title} className={styles.image} />
      </div>
      {/* Thumbnails row */}
      {allImages.length > 1 && (
        <div className={styles.thumbnailsRow}>
          {allImages.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              className={
                styles.thumbnail +
                (idx === currentImageIndex ? ' ' + styles.activeThumbnail : '')
              }
              onClick={() => setCurrentImageIndex(idx)}
            />
          ))}
        </div>
      )}
      <div className={styles.carInfo}>
        <h3>{car.title}</h3>
        <p>{car.description}</p>
        <p className={styles.price}>${car.price}</p>
        {car.miles && car.miles > 0 && (
          <p className={styles.miles}>Miles: {car.miles.toLocaleString()}</p>
        )}
        {car.year && (
          <p className={styles.year}>📅 {car.year}</p>
        )}
        {car.reg_district && car.reg_district !== 'Other' && (
          <p className={styles.city}>📍 {car.reg_district}</p>
        )}
        <p className={car.status === 'sold' ? styles.sold : styles.available}>
          {car.status === 'sold' ? 'Sold' : 'Available'}
        </p>
        
        {/* Buy button removed - users should browse first, then purchase from buyer dashboard */}
      </div>
    </div>
  );
}