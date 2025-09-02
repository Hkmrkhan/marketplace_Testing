import { useRouter } from 'next/router';
import { useComparison } from '../utils/ComparisonContext';
import styles from '../styles/ComparisonSidebar.module.css';

export default function ComparisonSidebar() {
  const { 
    comparisonCars, 
    showComparisonSidebar, 
    setShowComparisonSidebar, 
    removeFromComparison, 
    clearComparison,
    resetComparison
  } = useComparison();
  
  const router = useRouter();

  if (!showComparisonSidebar || comparisonCars.length === 0) {
    return null;
  }

  const handleCompareNow = () => {
    if (comparisonCars.length >= 2) {
      const carIds = comparisonCars.map(car => car.id).join(',');
      router.push(`/compare?cars=${carIds}`);
    }
  };

  const handleClose = () => {
    setShowComparisonSidebar(false);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h3>Compare Cars ({comparisonCars.length}/4)</h3>
        <button onClick={handleClose} className={styles.closeBtn}>✕</button>
      </div>
      
      <div className={styles.carsList}>
        {comparisonCars.map(car => (
          <div key={car.id} className={styles.carItem}>
            <img 
              src={car.image_url || car.image || '/carp2.png'} 
              alt={car.title} 
              className={styles.carImage}
            />
            <div className={styles.carInfo}>
              <h4 className={styles.carTitle}>{car.title}</h4>
              <p className={styles.carPrice}>${car.price?.toLocaleString()}</p>
              {car.year && <p className={styles.carYear}>{car.year}</p>}
            </div>
            <button 
              onClick={() => removeFromComparison(car.id)}
              className={styles.removeBtn}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      
      <div className={styles.actions}>
        {comparisonCars.length >= 2 && (
          <button 
            onClick={handleCompareNow}
            className={styles.compareBtn}
          >
            Compare Now
          </button>
        )}
        <button 
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all cars from comparison?')) {
              resetComparison();
            }
          }}
          className={styles.clearBtn}
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
