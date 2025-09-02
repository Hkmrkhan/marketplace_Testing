import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';
import styles from '../styles/Compare.module.css';

export default function ComparePage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCars = async () => {
      const { cars: carIds } = router.query;
      
      if (!carIds) {
        router.push('/cars');
        return;
      }

      const carIdArray = carIds.split(',');
      
      try {
        const { data, error } = await supabase
          .from('cars_with_seller_enhanced')
          .select('*')
          .in('id', carIdArray);

        if (error) {
          console.error('Error fetching cars:', error);
          setCars([]);
        } else {
          setCars(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
        setCars([]);
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      fetchCars();
    }
  }, [router.isReady, router.query]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading comparison...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (cars.length < 2) {
    return (
      <div>
        <Navbar />
        <div className={styles.error}>
          <h2>Not enough cars to compare</h2>
          <p>Please select at least 2 cars to compare.</p>
          <button 
            onClick={() => router.push('/cars')}
            className={styles.backBtn}
          >
            Back to Cars
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const comparisonFields = [
    { key: 'price', label: 'Price', type: 'currency', weight: 3 },
    { key: 'year', label: 'Year', type: 'text', weight: 2 },
    { key: 'miles', label: 'Miles', type: 'number', weight: 2 },
    { key: 'reg_district', label: 'City', type: 'text', weight: 1 },
    { key: 'status', label: 'Status', type: 'text', weight: 1 },
    { key: 'description', label: 'Description', type: 'text', weight: 1 }
  ];

  const formatValue = (value, type) => {
    if (!value) return 'N/A';
    
    switch (type) {
      case 'currency':
        return `$${Number(value).toLocaleString()}`;
      case 'number':
        return Number(value).toLocaleString();
      default:
        return value;
    }
  };

  // Calculate recommendations based on specs
  const getRecommendations = () => {
    if (cars.length < 2) return null;

    const recommendations = [];

    // Price analysis
    const prices = cars.map(car => Number(car.price) || 0);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (maxPrice - minPrice > avgPrice * 0.3) {
      const bestValue = cars.find(car => Number(car.price) === minPrice);
      recommendations.push({
        type: 'value',
        message: `🏆 Best Value: ${bestValue.title} at $${minPrice.toLocaleString()}`,
        car: bestValue
      });
    }

    // Year analysis
    const years = cars.map(car => Number(car.year) || 0);
    const newestYear = Math.max(...years);
    const newestCar = cars.find(car => Number(car.year) === newestYear);
    
    if (newestYear > 2020) {
      recommendations.push({
        type: 'newest',
        message: `🆕 Newest Model: ${newestCar.title} (${newestYear})`,
        car: newestCar
      });
    }

    // Mileage analysis
    const mileages = cars.map(car => Number(car.miles) || 0);
    const lowestMiles = Math.min(...mileages);
    const lowestMileageCar = cars.find(car => Number(car.miles) === lowestMiles);
    
    if (lowestMiles < 50000) {
      recommendations.push({
        type: 'mileage',
        message: `📏 Lowest Mileage: ${lowestMileageCar.title} (${lowestMiles.toLocaleString()} miles)`,
        car: lowestMileageCar
      });
    }

    // Overall recommendation
    const scores = cars.map(car => {
      let score = 0;
      const price = Number(car.price) || 0;
      const year = Number(car.year) || 0;
      const miles = Number(car.miles) || 0;

      // Price score (lower is better)
      if (price <= avgPrice) score += 3;
      else if (price <= avgPrice * 1.2) score += 2;
      else score += 1;

      // Year score (newer is better)
      if (year >= 2020) score += 2;
      else if (year >= 2018) score += 1;

      // Mileage score (lower is better)
      if (miles <= 30000) score += 2;
      else if (miles <= 60000) score += 1;

      return { car, score };
    });

    const bestOverall = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    recommendations.push({
      type: 'overall',
      message: `⭐ Overall Best: ${bestOverall.car.title} (Score: ${bestOverall.score}/7)`,
      car: bestOverall.car
    });

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div>
      <Navbar />
      
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Car Comparison</h1>
          <p>Compare {cars.length} cars side by side</p>
        </div>

        <div className={styles.comparisonTable}>
          <div className={styles.tableHeader}>
            <div className={styles.featureColumn}>Features</div>
            {cars.map(car => (
              <div key={car.id} className={styles.carColumn}>
                <img 
                  src={car.image_url || car.image || '/carp2.png'} 
                  alt={car.title} 
                  className={styles.carImage}
                />
                <h3 className={styles.carTitle}>{car.title}</h3>
                <p className={styles.carPrice}>${car.price?.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className={styles.tableBody}>
            {comparisonFields.map(field => (
              <div key={field.key} className={styles.row}>
                <div className={styles.featureColumn}>
                  <strong>{field.label}</strong>
                </div>
                {cars.map(car => (
                  <div key={car.id} className={styles.carColumn}>
                    {formatValue(car[field.key], field.type)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Section */}
        {recommendations && recommendations.length > 0 && (
          <div className={styles.recommendations}>
            <h2>🤖 Smart Recommendations</h2>
            <div className={styles.recommendationList}>
              {recommendations.map((rec, index) => (
                <div key={index} className={styles.recommendationItem}>
                  <span className={styles.recommendationMessage}>{rec.message}</span>
                  <button 
                    onClick={() => router.push(`/cars/${rec.car.id}`)}
                    className={styles.viewCarBtn}
                  >
                    View Car
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button 
            onClick={() => router.push('/cars')}
            className={styles.backBtn}
          >
            ← Back to Cars
          </button>
          
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all cars from comparison?')) {
                // Clear from localStorage
                localStorage.removeItem('comparisonCars');
                // Force page refresh to reset all states
                window.location.href = '/cars';
              }
            }}
            className={styles.clearBtn}
          >
            Clear Comparison
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
