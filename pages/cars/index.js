import { useEffect, useState } from 'react';
import CarCard from '../../components/CarCard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { supabase } from '../../utils/supabaseClient';
import styles from '../../styles/Cars.module.css';

export default function CarsPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  const fetchCars = async () => {
    setLoading(true);
    // Fetch from Supabase view 'cars_with_seller'
    const { data, error } = await supabase
      .from('cars_with_seller')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    if (error) {
      setCars([]);
    } else {
      setCars(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    };
    fetchUser();
    fetchCars();
  }, []);

  const filteredCars = cars.filter(car => {
    if (car.status === 'available') {
      return car.title.toLowerCase().includes(searchTerm.toLowerCase()) || (car.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    }
    if (userProfile?.user_type === 'buyer' && car.status === 'sold' && car.buyer_id === userProfile.id) {
      return true;
    }
    if (userProfile?.user_type === 'seller' && car.status === 'sold' && car.seller_id === userProfile.id) {
      return true;
    }
    return false;
  });

  return (
    <div>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <img src="/carp.png" alt="Cars for Sale" className={styles.headerImage} />
              <div className={styles.headerText}>
                <h1>Premium Cars for Sale</h1>
                <p>Discover Amazing Deals on Quality Vehicles from Trusted Sellers</p>
                <div className={styles.headerBadge}>
                  <span>🔥 Hot Deals</span>
                  <span>⭐ Verified Sellers</span>
                  <span>💎 Best Prices</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.searchSection}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search cars by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.stats}>
              <span className={styles.statItem}>
                {filteredCars.length} cars available
              </span>
            </div>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}>🔄</div>
              <p>Loading cars...</p>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className={styles.emptyState}>
              <img src="/carp2.png" alt="No Cars" className={styles.emptyImage} />
              <h3>No cars found</h3>
              <p>{searchTerm ? 'Try adjusting your search terms' : 'Be the first to add a car!'}</p>
            </div>
          ) : (
            <div className={styles.carsGrid}>
              {filteredCars.map(car => (
                <div key={car.car_id || car.id}>
                  <CarCard car={car} />
                  <div className={styles.sellerInfo}>
                    <span>Seller: <b>{car.seller_name || 'Unknown'}</b></span>
                    {car.seller_email && <span style={{ marginLeft: 8, color: '#888' }}>({car.seller_email})</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
