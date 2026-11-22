import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';

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
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-slate-400">Loading comparison...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (cars.length < 2) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="max-w-md p-8 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Not enough cars to compare</h2>
            <p className="text-sm text-slate-400 mb-6">Please select at least 2 cars to compare.</p>
            <button 
              onClick={() => router.push('/cars')}
              className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer text-sm shadow-md"
            >
              Back to Cars
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const comparisonFields = [
    { key: 'price', label: 'Price', type: 'currency' },
    { key: 'year', label: 'Year', type: 'text' },
    { key: 'miles', label: 'Miles', type: 'number' },
    { key: 'reg_district', label: 'City', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' }
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

  const getRecommendations = () => {
    if (cars.length < 2) return null;
    const recommendations = [];

    const prices = cars.map(car => Number(car.price) || 0);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (maxPrice - minPrice > avgPrice * 0.3) {
      const bestValue = cars.find(car => Number(car.price) === minPrice);
      if (bestValue) {
        recommendations.push({
          type: 'value',
          message: `🏆 Best Value: ${bestValue.title} at $${minPrice.toLocaleString()}`,
          car: bestValue
        });
      }
    }

    const years = cars.map(car => Number(car.year) || 0);
    const newestYear = Math.max(...years);
    const newestCar = cars.find(car => Number(car.year) === newestYear);
    if (newestYear > 2020 && newestCar) {
      recommendations.push({
        type: 'newest',
        message: `🆕 Newest Model: ${newestCar.title} (${newestYear})`,
        car: newestCar
      });
    }

    const mileages = cars.map(car => Number(car.miles) || 0);
    const lowestMiles = Math.min(...mileages);
    const lowestMileageCar = cars.find(car => Number(car.miles) === lowestMiles);
    if (lowestMiles < 50000 && lowestMileageCar) {
      recommendations.push({
        type: 'mileage',
        message: `📏 Lowest Mileage: ${lowestMileageCar.title} (${lowestMiles.toLocaleString()} miles)`,
        car: lowestMileageCar
      });
    }

    const scores = cars.map(car => {
      let score = 0;
      const price = Number(car.price) || 0;
      const year = Number(car.year) || 0;
      const miles = Number(car.miles) || 0;

      if (price <= avgPrice) score += 3;
      else if (price <= avgPrice * 1.2) score += 2;
      else score += 1;

      if (year >= 2020) score += 2;
      else if (year >= 2018) score += 1;

      if (miles <= 30000) score += 2;
      else if (miles <= 60000) score += 1;

      return { car, score };
    });

    const bestOverall = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    if (bestOverall?.car) {
      recommendations.push({
        type: 'overall',
        message: `⭐ Overall Best: ${bestOverall.car.title} (Score: ${bestOverall.score}/7)`,
        car: bestOverall.car
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Car <span className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">Comparison</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">Compare {cars.length} vehicles side by side</p>
        </div>

        {/* Comparison Table */}
        <div className="rounded-3xl backdrop-blur-2xl bg-slate-900/80 border border-white/10 overflow-hidden shadow-2xl mb-10">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-4 sm:p-6 w-1/4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Features
                  </th>
                  {cars.map(car => (
                    <th key={car.id} className="p-4 sm:p-6 text-center">
                      <div className="relative h-32 w-full max-w-[200px] mx-auto rounded-2xl overflow-hidden mb-3 border border-white/10">
                        <img 
                          src={car.image_url || car.image || '/carp2.png'} 
                          alt={car.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-sm font-bold text-white truncate">{car.title}</h3>
                      <p className="text-sm font-black text-indigo-400 mt-1">${car.price?.toLocaleString()}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {comparisonFields.map(field => (
                  <tr key={field.key} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 sm:p-6 font-semibold text-slate-300 text-xs sm:text-sm">
                      {field.label}
                    </td>
                    {cars.map(car => (
                      <td key={car.id} className="p-4 sm:p-6 text-center text-xs sm:text-sm text-slate-200">
                        {formatValue(car[field.key], field.type)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations Section */}
        {recommendations && recommendations.length > 0 && (
          <div className="rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-white/10 p-6 sm:p-8 mb-10 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🤖</span> Smart Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-xs sm:text-sm font-medium text-slate-200">{rec.message}</span>
                  <button 
                    onClick={() => router.push(`/cars/${rec.car.id}`)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all whitespace-nowrap cursor-pointer"
                  >
                    View Car
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button 
            onClick={() => router.push('/cars')}
            className="px-6 py-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            ← Back to Cars
          </button>
          
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all cars from comparison?')) {
                localStorage.removeItem('comparisonCars');
                window.location.href = '/cars';
              }
            }}
            className="px-6 py-3 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
          >
            Clear Comparison
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
