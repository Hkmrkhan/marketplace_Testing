import { useState } from 'react';
import { useRouter } from 'next/router';
import { useComparison } from '../utils/ComparisonContext';
import { getAllCarImages, onImageErrorFallback } from '../utils/carImages';

export default function CarCard({ car, userProfile }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();
  const { addToComparison, isInComparison, comparisonCars } = useComparison();
  
  const allImages = getAllCarImages(car);
  const imageSrc = allImages[currentImageIndex] || allImages[0] || '/carp2.webp';

  const handleCarClick = () => {
    router.push(`/cars/${car.car_id || car.id}`);
  };

  const handleDiscussInForum = () => {
    router.push(`/forum/create?car_title=${encodeURIComponent(car.title)}&car_id=${car.car_id || car.id}`);
  };

  const isCompared = isInComparison(car.id) && comparisonCars.length > 0;

  return (
    <div className="group rounded-3xl backdrop-blur-2xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/50 p-4 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/20 flex flex-col justify-between">

      <div onClick={handleCarClick} className="cursor-pointer">
        
        <div className="relative h-52 w-full rounded-2xl overflow-hidden mb-3 bg-slate-950">
          <img 
            src={imageSrc} 
            alt={car.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            onError={(e) => onImageErrorFallback(e, car.title)}
          />
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-extrabold text-white bg-indigo-600/90 backdrop-blur-md shadow-md">
            ${car.price}
          </div>
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur-md ${car.status === 'sold' ? 'bg-rose-500/80 text-white' : 'bg-emerald-500/80 text-white'}`}>
              {car.status === 'sold' ? 'Sold' : 'Available'}
            </span>
          </div>
        </div>

        {allImages.length > 1 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" onClick={(e) => e.stopPropagation()}>
            {allImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className={`w-12 h-10 rounded-lg object-cover cursor-pointer border-2 transition-all ${
                  idx === currentImageIndex 
                    ? 'border-indigo-500 scale-105 shadow-sm' 
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                onClick={() => setCurrentImageIndex(idx)}
                onError={(e) => onImageErrorFallback(e, car.title)}
              />
            ))}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
            {car.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {car.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
            {car.miles && car.miles > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                ⚡ {car.miles.toLocaleString()} mi
              </span>
            )}
            {car.year && (
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                📅 {car.year}
              </span>
            )}
            {car.reg_district && car.reg_district !== 'Other' && (
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                📍 {car.reg_district}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
        {userProfile?.user_type !== 'admin' && (
          <button 
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isCompared 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              addToComparison(car);
            }}
          >
            {isCompared ? '✓ Added' : '⚖️ Compare'}
          </button>
        )}
        
        <button 
          className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleDiscussInForum();
          }}
        >
          💬 Forum
        </button>
      </div>

    </div>
  );
}
