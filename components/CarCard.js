import { useState } from 'react';
import { useRouter } from 'next/router';
import { useComparison } from '../utils/ComparisonContext';
import styles from '../styles/CarCard.module.css';

export default function CarCard({ car, userProfile }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();
  const { addToComparison, isInComparison, comparisonCars } = useComparison();
  
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

  const handleCarClick = () => {
    // Navigate to car detail page
    router.push(`/cars/${car.car_id || car.id}`);
  };

  const handleDiscussInForum = () => {
    // Navigate to create discussion page with car info pre-filled
    router.push(`/forum/create?car_title=${encodeURIComponent(car.title)}&car_id=${car.car_id || car.id}`);
  };

  return (
    <div className={styles.card}>
      {/* Clickable car image and info area */}
      <div 
        className={styles.clickableArea}
        onClick={handleCarClick}
        style={{ cursor: 'pointer' }}
      >
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
        
        {/* Action Buttons */}
        <div style={{ marginTop: 8, display: 'flex', gap: '8px' }}>
          {/* Compare Button - Hide for admin */}
          {userProfile?.user_type !== 'admin' && (
            <button 
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: (isInComparison(car.id) && comparisonCars.length > 0) ? '#059669' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'background-color 0.2s'
              }}
              onClick={(e) => {
                e.stopPropagation();
                addToComparison(car);
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = (isInComparison(car.id) && comparisonCars.length > 0) ? '#047857' : '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = (isInComparison(car.id) && comparisonCars.length > 0) ? '#059669' : '#3b82f6'}
            >
              {(isInComparison(car.id) && comparisonCars.length > 0) ? '✓ Added' : '⚖️ Compare'}
            </button>
          )}
          
          {/* Discuss in Forum Button */}
          <button 
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: 'rgb(5, 150, 105)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'background-color 0.2s'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleDiscussInForum();
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgb(4, 120, 84)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgb(5, 150, 105)'}
          >
            💬 Forum
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}