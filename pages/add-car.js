import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarForm from '../components/CarForm';
import { supabase } from '../utils/supabaseClient';

export default function AddCarPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
      
      if (profile?.user_type !== 'seller') {
        setMessage('❌ Only sellers can add cars. Please login as a seller.');
        setLoading(false);
        return;
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const handleAddCar = async (car, resetForm) => {
    if (!user || userProfile?.user_type !== 'seller') {
      setMessage('❌ Only sellers can add cars.');
      return;
    }

    setLoading(true);
    try {
      let videoUrl = null;
      
      if (car.videoFile) {
        setMessage('📹 Uploading video...');
        const fileExt = car.videoFile.name.split('.').pop();
        const fileName = `video-${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `videos/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('car_videos')
          .upload(filePath, car.videoFile);

        if (uploadError) {
          setMessage('❌ Error uploading video: ' + uploadError.message);
          setLoading(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('car_videos')
          .getPublicUrl(filePath);
        
        videoUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('cars')
        .insert([
          {
            user_id: user.id,
            seller_id: user.id,
            title: car.title,
            description: car.description,
            price: parseFloat(car.price),
            miles: car.miles ? parseInt(car.miles) : 0,
            reg_district: car.reg_district || 'Other',
            year: car.year ? parseInt(car.year) : 2020,
            image_url: car.images[0],
            additional_images: car.images.slice(1),
            video_url: videoUrl,
            status: 'available'
          }
        ])
        .select();

      if (error) {
        setMessage('❌ Error adding car: ' + error.message);
      } else {
        setMessage('✅ Car added successfully! Redirecting to dashboard...');
        resetForm();
        setTimeout(() => {
          router.push('/seller-dashboard');
        }, 2000);
      }
    } catch (error) {
      setMessage('❌ Error adding car: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (userProfile?.user_type !== 'seller') {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md p-8 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-white/10 text-center shadow-2xl">
            <h1 className="text-2xl font-bold text-white mb-2">❌ Access Denied</h1>
            <p className="text-sm text-slate-400 mb-6">Only sellers can add cars. Please login as a seller.</p>
            <button 
              onClick={() => router.push('/auth/login')} 
              className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all text-xs"
            >
              Go to Login
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header Banner */}
        <div className="relative rounded-3xl overflow-hidden backdrop-blur-2xl bg-slate-900/80 border border-white/10 p-8 mb-10 shadow-2xl flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">Seller Studio</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Add Your Car</h1>
            <p className="text-sm text-slate-400">List your car and reach thousands of potential buyers across the marketplace</p>
          </div>
          <div className="w-32 h-24 rounded-2xl overflow-hidden border border-white/10">
            <img src="/graphic1.webp" alt="Add Car" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Form Container */}
        <div className="mb-12">
          <CarForm 
            onSubmit={handleAddCar} 
            onCancel={() => router.push('/seller-dashboard')}
          />
          {message && (
            <div className={`mt-6 p-4 rounded-2xl text-xs font-semibold border ${message.startsWith('✅') ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/60 border-rose-500/30 text-rose-300'}`}>
              {message}
            </div>
          )}
        </div>

        {/* Highlight Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/60 border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden">
              <img src="/graphic2.webp" alt="Easy Listing" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Easy Listing</h3>
              <p className="text-xs text-slate-400">Upload details in minutes</p>
            </div>
          </div>
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/60 border border-white/10 flex items-center gap-4">
            <div className="text-2xl p-2.5 rounded-2xl bg-white/5 border border-white/10">📱</div>
            <div>
              <h3 className="text-sm font-bold text-white">Reach More Buyers</h3>
              <p className="text-xs text-slate-400">Thousands of daily viewers</p>
            </div>
          </div>
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/60 border border-white/10 flex items-center gap-4">
            <div className="text-2xl p-2.5 rounded-2xl bg-white/5 border border-white/10">💰</div>
            <div>
              <h3 className="text-sm font-bold text-white">Best Prices</h3>
              <p className="text-xs text-slate-400">Maximize your car value</p>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
