import { useRouter } from 'next/router';
import { useComparison } from '../utils/ComparisonContext';

export default function ComparisonSidebar() {
  const { 
    comparisonCars, 
    showComparisonSidebar, 
    setShowComparisonSidebar, 
    removeFromComparison, 
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
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-3xl backdrop-blur-2xl bg-slate-900/90 border border-white/15 p-5 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>⚖️</span> Compare Cars ({comparisonCars.length}/4)
        </h3>
        <button 
          onClick={handleClose} 
          className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {comparisonCars.map(car => (
          <div key={car.id} className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
            <img 
              src={car.image_url || car.image || '/carp2.webp'} 
              alt={car.title} 
              className="w-14 h-12 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-white truncate">{car.title}</h4>
              <p className="text-xs font-bold text-indigo-400 mt-0.5">${car.price?.toLocaleString()}</p>
              {car.year && <p className="text-[10px] text-slate-400">{car.year}</p>}
            </div>
            <button 
              onClick={() => removeFromComparison(car.id)}
              className="text-slate-500 hover:text-rose-400 p-1 text-xs transition-colors"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
        {comparisonCars.length >= 2 && (
          <button 
            onClick={handleCompareNow}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
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
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
