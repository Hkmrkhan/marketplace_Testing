import { useEffect, useState } from 'react';
import CarCard from '../../components/CarCard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import VoiceSearch from '../../components/VoiceSearch';
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

  // Enhanced search function for better voice search support
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  const fuzzyMatch = (searchTerm, text) => {
    const normalizedSearch = normalizeText(searchTerm);
    const normalizedText = normalizeText(text);
    
    // Direct match
    if (normalizedText.includes(normalizedSearch)) {
      return true;
    }
    
    // Split search term and check individual words
    const searchWords = normalizedSearch.split(' ').filter(word => word.length > 1);
    const textWords = normalizedText.split(' ');
    
    // Check if most search words are present
    let matchCount = 0;
    searchWords.forEach(searchWord => {
      textWords.forEach(textWord => {
        // Exact word match
        if (textWord.includes(searchWord) || searchWord.includes(textWord)) {
          matchCount++;
        }
        // Similarity for voice recognition errors - more lenient for car names
        else if (searchWord.length > 2 && textWord.length > 2) {
          const similarity = calculateSimilarity(searchWord, textWord);
          // Lower threshold for better voice search support
          if (similarity > 0.5) {
            matchCount++;
          }
        }
        // Special case for short car names (3-4 letters)
        else if (searchWord.length <= 4 && textWord.length <= 4 && searchWord.length > 2) {
          const similarity = calculateSimilarity(searchWord, textWord);
          if (similarity > 0.4) {
            matchCount++;
          }
        }
      });
    });
    
    return searchWords.length > 0 && matchCount >= Math.ceil(searchWords.length * 0.5);
  };

  // Simple similarity calculation
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const getEditDistance = (str1, str2) => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const filteredCars = cars.filter(car => {
    if (car.status === 'available') {
      if (!searchTerm.trim()) return true;
      
      const titleMatch = fuzzyMatch(searchTerm, car.title || '');
      const descriptionMatch = fuzzyMatch(searchTerm, car.description || '');
      
      return titleMatch || descriptionMatch;
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
              <VoiceSearch onSearchChange={setSearchTerm} />
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
