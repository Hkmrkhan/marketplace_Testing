import styles from '../styles/CarCard.module.css';

export default function CarCard({ car }) {
  // Use image_url if available, then image, then fallback
  const imageSrc = (car.image_url && car.image_url.trim() !== '')
    ? car.image_url
    : (car.image && car.image.trim() !== '' ? car.image : '/carp2.png');

  return (
    <div className={styles.card}>
      <div className={styles.carImageWrapper}>
        <img src={imageSrc} alt={car.title} className={styles.image} />
      </div>
      <div className={styles.carInfo}>
        <h3>{car.title}</h3>
        <p>{car.description}</p>
        <p className={styles.price}>${car.price}</p>
        <p className={car.status === 'sold' ? styles.sold : styles.available}>
          {car.status === 'sold' ? 'Sold' : 'Available'}
        </p>
      </div>
    </div>
  );
}
