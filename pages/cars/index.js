import { useEffect, useState } from 'react';
import CarCard from '../../components/CarCard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import VoiceSearch from '../../components/VoiceSearch';
import CarFilter from '../../components/CarFilter';
import { supabase } from '../../utils/supabaseClient';
import styles from '../../styles/Cars.module.css';

export default function CarsPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [filters, setFilters] = useState({
    title: '',
    minPrice: '',
    maxPrice: '',
    miles_min: '',
    miles_max: '',
    reg_district: '',
    year_min: '',
    year_max: '',
    priceRange: ''
  });

  const fetchCars = async () => {
    setLoading(true);
    // Fetch from Supabase view 'cars_with_seller_enhanced' - only approved cars
    const { data, error } = await supabase
      .from('cars_with_seller_enhanced')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    
    // Filter approved cars on frontend
    if (data) {
      const approvedCars = data.filter(car => {
        // If car has approval_status, check it's approved
        if (car.approval_status) {
          return car.approval_status === 'approved';
        }
        // If no approval_status, show it (existing cars)
        return true;
      });
      setCars(approvedCars);
    } else {
      setCars([]);
    }
    if (error) {
      setCars([]);
    } else {
      // Clean descriptions for all cars
      const cleanedCars = (data || []).map(car => {
        if (car.description) {
          console.log('Original car description:', car.description);
          
          // Remove the specific Supabase link pattern with @ symbol
          car.description = car.description.replace(/@luxuryhttps:\/\/supabase\.com\/dashboard\/project\/[^\s]+/g, 'Luxury car');
          // Remove the specific Supabase link pattern
          car.description = car.description.replace(/luxuryhttps:\/\/supabase\.com\/dashboard\/project\/[^\s]+/g, 'Luxury car');
          // Remove Bing image URLs
          car.description = car.description.replace(/https:\/\/th\.bing\.com\/th\?id=[^\s]+/g, '');
          // Remove any URLs or Supabase links from description
          car.description = car.description.replace(/https?:\/\/[^\s]+/g, '').trim();
          // Remove any database references or technical strings
          car.description = car.description.replace(/supabase\.com\/dashboard\/project\/[^\s]+/g, '').trim();
          car.description = car.description.replace(/schema=public/g, '').trim();
          car.description = car.description.replace(/editor\/\d+/g, '').trim();
          // Remove price from description if it's mixed in
          car.description = car.description.replace(/\d{4,5}\s*$/g, '').trim();
          // Clean up multiple spaces
          car.description = car.description.replace(/\s+/g, ' ').trim();
          
          // If description still contains problematic patterns, completely replace it
          if (car.description.includes('supabase.com') || car.description.includes('@luxury') || car.description.includes('schema=public') || car.description.includes('luxuryhttps')) {
            car.description = 'Luxury car with premium features and excellent condition. Perfect for those looking for a high-end vehicle with all modern amenities. Contact seller for more details and test drive.';
          }
          
          // If description is empty after cleaning, set a default
          if (!car.description) {
            car.description = 'Luxury car with premium features. Contact seller for more details.';
          }
          
          console.log('Cleaned car description:', car.description);
        }
        return car;
      });
      setCars(cleanedCars);
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

  // Filter handling function
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'clear') {
      setFilters({
        title: '',
        minPrice: '',
        maxPrice: '',
        miles_min: '',
        miles_max: '',
        reg_district: '',
        year_min: '',
        year_max: '',
        priceRange: ''
      });
      return;
    }
    
    if (filterType === 'load') {
      setFilters(value);
      return;
    }
    
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Apply filters to cars
  const filteredCars = cars.filter(car => {
    console.log('Filtering car:', {
      id: car.id,
      title: car.title,
      price: car.price,
      miles: car.miles,
      reg_district: car.reg_district,
      year: car.year,
      status: car.status
    });
    
    if (car.status === 'available') {
      // Search term filter
      if (searchTerm.trim()) {
        const titleMatch = fuzzyMatch(searchTerm, car.title || '');
        const descriptionMatch = fuzzyMatch(searchTerm, car.description || '');
        if (!titleMatch && !descriptionMatch) return false;
      }
      
      // Title filter
      if (filters.title && !car.title?.toLowerCase().includes(filters.title.toLowerCase())) {
        console.log('Filtered out by title:', car.title);
        return false;
      }
      
      // Price range filter
      if (filters.minPrice && car.price < parseFloat(filters.minPrice)) {
        console.log('Filtered out by min price:', car.price, '<', filters.minPrice);
        return false;
      }
      if (filters.maxPrice && car.price > parseFloat(filters.maxPrice)) {
        console.log('Filtered out by max price:', car.price, '>', filters.maxPrice);
        return false;
      }
      
      // Quick price range filter
      if (filters.priceRange) {
        const price = car.price;
        switch (filters.priceRange) {
          case 'budget':
            if (price > 1000) return false;
            break;
          case 'mid':
            if (price < 1000 || price > 5000) return false;
            break;
          case 'premium':
            if (price < 5000 || price > 10000) return false;
            break;
          case 'luxury':
            if (price < 10000) return false;
            break;
        }
      }
      
      // Miles range filter
      if (filters.miles_min && filters.miles_min.trim() !== '') {
        const filterMilesMin = parseFloat(filters.miles_min);
        if (car.miles && car.miles < filterMilesMin) {
          console.log('Filtered out by min miles:', car.miles, '<', filterMilesMin);
          return false;
        }
      }
      if (filters.miles_max && filters.miles_max.trim() !== '') {
        const filterMilesMax = parseFloat(filters.miles_max);
        if (car.miles && car.miles > filterMilesMax) {
          console.log('Filtered out by max miles:', car.miles, '>', filterMilesMax);
          return false;
        }
      }
      
              // City filter
        if (filters.reg_district && filters.reg_district.trim() !== '') {
          if (!car.reg_district || car.reg_district !== filters.reg_district) {
            console.log('Filtered out by city:', car.reg_district, '!=', filters.reg_district);
          return false;
        }
      }
      
      // Year range filter
      if (filters.year_min && car.year && car.year < parseInt(filters.year_min)) {
        console.log('Filtered out by min year:', car.year, '<', filters.year_min);
        return false;
      }
      if (filters.year_max && car.year && car.year > parseInt(filters.year_max)) {
        console.log('Filtered out by max year:', car.year, '>', filters.year_max);
        return false;
      }
      
      console.log('Car passed all filters:', car.title);
      return true;
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

          {/* Filter Section */}
          <CarFilter onFilterChange={handleFilterChange} filters={filters} />

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
