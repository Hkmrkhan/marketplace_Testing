import { useEffect, useState } from 'react';
import CarCard from '../../components/CarCard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import VoiceSearch from '../../components/VoiceSearch';
import CarFilter from '../../components/CarFilter';
import { supabase } from '../../utils/supabaseClient';

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
    const { data, error } = await supabase
      .from('cars')
      .select(`
        *,
        profiles!inner(
          full_name,
          email,
          whatsapp_number
        ),
        admin_approvals(
          approval_status,
          approved_at
        )
      `)
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching cars:', error);
      setCars([]);
      setLoading(false);
      return;
    }
    
    if (data) {
      const approvedCars = data.filter(car => {
        const hasApproval = car.admin_approvals && car.admin_approvals.length > 0;
        return hasApproval && car.admin_approvals.some(approval => approval.approval_status === 'approved');
      });
      
      const cleanedCars = approvedCars.map(car => {
        if (car.description) {
          car.description = car.description.replace(/@luxuryhttps:\/\/supabase\.com\/dashboard\/project\/[^\s]+/g, 'Luxury car');
          car.description = car.description.replace(/luxuryhttps:\/\/supabase\.com\/dashboard\/project\/[^\s]+/g, 'Luxury car');
          car.description = car.description.replace(/https:\/\/th\.bing\.com\/th\?id=[^\s]+/g, '');
          car.description = car.description.replace(/https?:\/\/[^\s]+/g, '').trim();
          car.description = car.description.replace(/supabase\.com\/dashboard\/project\/[^\s]+/g, '').trim();
          car.description = car.description.replace(/schema=public/g, '').trim();
          car.description = car.description.replace(/editor\/\d+/g, '').trim();
          car.description = car.description.replace(/\d{4,5}\s*$/g, '').trim();
          car.description = car.description.replace(/\s+/g, ' ').trim();
          
          if (car.description.includes('supabase.com') || car.description.includes('@luxury') || car.description.includes('schema=public') || car.description.includes('luxuryhttps')) {
            car.description = 'Luxury car with premium features and excellent condition. Perfect for those looking for a high-end vehicle with all modern amenities. Contact seller for more details and test drive.';
          }
          if (!car.description) {
            car.description = 'Luxury car with premium features. Contact seller for more details.';
          }
        }
        return car;
      });
      setCars(cleanedCars);
    } else {
      setCars([]);
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
    localStorage.removeItem('comparisonCars');
  }, []);

  const normalizeText = (text) => {
    return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  };

  const fuzzyMatch = (searchTerm, text) => {
    const normalizedSearch = normalizeText(searchTerm);
    const normalizedText = normalizeText(text);
    if (normalizedText.includes(normalizedSearch)) return true;
    
    const searchWords = normalizedSearch.split(' ').filter(word => word.length > 1);
    const textWords = normalizedText.split(' ');
    
    let matchCount = 0;
    searchWords.forEach(searchWord => {
      textWords.forEach(textWord => {
        if (textWord.includes(searchWord) || searchWord.includes(textWord)) {
          matchCount++;
        }
      });
    });
    return searchWords.length > 0 && matchCount >= Math.ceil(searchWords.length * 0.5);
  };

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
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const filteredCars = cars.filter(car => {
    if (car.status === 'available') {
      if (searchTerm.trim()) {
        const titleMatch = fuzzyMatch(searchTerm, car.title || '');
        const descriptionMatch = fuzzyMatch(searchTerm, car.description || '');
        if (!titleMatch && !descriptionMatch) return false;
      }
      if (filters.title && !car.title?.toLowerCase().includes(filters.title.toLowerCase())) return false;
      if (filters.minPrice && car.price < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && car.price > parseFloat(filters.maxPrice)) return false;
      if (filters.miles_min && car.miles && car.miles < parseFloat(filters.miles_min)) return false;
      if (filters.miles_max && car.miles && car.miles > parseFloat(filters.miles_max)) return false;
      if (filters.reg_district && car.reg_district !== filters.reg_district) return false;
      if (filters.year_min && car.year && car.year < parseInt(filters.year_min)) return false;
      if (filters.year_max && car.year && car.year > parseInt(filters.year_max)) return false;
      return true;
    }
    if (userProfile?.user_type === 'buyer' && car.status === 'sold' && car.buyer_id === userProfile.id) return true;
    if (userProfile?.user_type === 'seller' && car.status === 'sold' && car.seller_id === userProfile.id) return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="relative rounded-3xl overflow-hidden backdrop-blur-2xl bg-slate-900/80 border border-white/10 p-8 sm:p-12 mb-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
                <span>🔥 Verified Fleet</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Premium Cars for Sale
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Discover Amazing Deals on Quality Vehicles from Trusted Sellers
              </p>
              
              <div className="flex flex-wrap gap-2.5 pt-1">
                <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                  🔥 Hot Deals
                </span>
                <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                  ⭐ Verified Sellers
                </span>
                <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                  💎 Best Prices
                </span>
              </div>

              <div className="pt-2">
                <p className="text-xs text-cyan-300/80 bg-cyan-950/40 border border-cyan-500/20 px-3.5 py-2 rounded-xl inline-block m-0">
                  💡 <strong>How to buy:</strong> Browse cars here → Login as buyer → Purchase from dashboard
                </p>
              </div>
            </div>

            <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-white/10 shadow-lg">
              <img src="/carp.webp" alt="Cars for Sale" className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
          <div className="relative flex-1 w-full flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Search cars by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-900/80 border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md"
              />
            </div>
            <VoiceSearch onSearchChange={setSearchTerm} />
          </div>

          <div className="px-4 py-3 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 whitespace-nowrap shadow-sm">
            {filteredCars.length} cars available
          </div>
        </div>

        <CarFilter onFilterChange={handleFilterChange} filters={filters} />

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-400">Loading cars...</p>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="py-20 text-center rounded-3xl backdrop-blur-xl bg-slate-900/50 border border-white/10 p-8 max-w-md mx-auto">
            <img src="/carp2.webp" alt="No Cars" className="w-40 h-auto mx-auto mb-4 opacity-75" />
            <h3 className="text-xl font-bold text-white mb-2">No cars found</h3>
            <p className="text-xs text-slate-400">
              {searchTerm ? 'Try adjusting your search terms or filters' : 'Be the first to add a car!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map(car => (
              <div key={car.car_id || car.id}>
                <CarCard car={car} userProfile={userProfile} />
              </div>
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
