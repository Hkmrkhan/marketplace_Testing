import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { supabase } from '../../utils/supabaseClient';

export default function EditCarPage() {
  const router = useRouter();
  const { id } = router.query;
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');

  useEffect(() => {
    const fetchUserAndCar = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        router.push('/auth/login');
        return;
      }
      setUser(user);
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
      
      const { data: carData, error } = await supabase.from('cars').select('*').eq('id', id).single();
      if (error || !carData) {
        setCar(null);
        setLoading(false);
        return;
      }
      
      if (carData.user_id !== user.id && profile?.user_type !== 'admin') {
        setCar(null);
        setLoading(false);
        setMessage('You are not authorized to edit this car.');
        return;
      }
      
      setCar(carData);
      setLoading(false);
    };
    if (id) fetchUserAndCar();
  }, [id, router]);

  const handleChange = (e) => {
    setCar({ ...car, [e.target.name]: e.target.value });
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file (MP4, AVI, MOV, etc.)');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('Video file size must be less than 50MB');
        return;
      }
      setVideoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!car) {
      setMessage('Car not found.');
      return;
    }
    
    try {
      let videoUrl = car.video_url;
      
      if (videoFile) {
        setMessage('📹 Uploading new video...');
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `video-${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `videos/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('car_videos')
          .upload(filePath, videoFile);

        if (uploadError) {
          setMessage('❌ Error uploading video: ' + uploadError.message);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('car_videos')
          .getPublicUrl(filePath);
        
        videoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('cars').update({
        title: car.title,
        description: car.description,
        price: parseFloat(car.price),
        miles: car.miles ? parseInt(car.miles) : 0,
        reg_district: car.reg_district || 'Other',
        year: car.year ? parseInt(car.year) : 2020,
        image_url: car.image_url,
        additional_images: car.additional_images?.filter(img => img && img.trim() !== '') || [],
        video_url: videoUrl
      }).eq('id', car.id);
      
      if (error) {
        setMessage('Failed to update car: ' + error.message);
        return;
      }
      
      setMessage('✅ Car updated successfully!');
      if (userProfile?.user_type === 'admin') {
        setTimeout(() => router.push('/admin-dashboard'), 1500);
      } else {
        setTimeout(() => router.push('/seller-dashboard'), 1500);
      }
    } catch (error) {
      setMessage('An unexpected error occurred: ' + error.message);
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

  if (!car) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="max-w-md p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">{message || 'Car not found.'}</h2>
            <button 
              onClick={() => router.push('/seller-dashboard')}
              className="mt-4 px-6 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-3xl backdrop-blur-2xl bg-slate-900/80 border border-white/10 p-6 sm:p-10 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Edit Car Details</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Update your car information below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Car Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g., Toyota Corolla 2020"
                value={car.title || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="description"
                placeholder="Describe your car's features, condition, and any special details..."
                value={car.description || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows="4"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Price ($) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  placeholder="15000"
                  value={car.price || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  step="100"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Miles
                </label>
                <input
                  type="number"
                  name="miles"
                  placeholder="50000"
                  value={car.miles || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Registration City
                </label>
                <select
                  name="reg_district"
                  value={car.reg_district || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select City</option>
                  {['Islamabad', 'Lahore', 'Karachi', 'Peshawar', 'Quetta', 'Faisalabad', 'Multan', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Year
                </label>
                <input
                  type="number"
                  name="year"
                  placeholder="2020"
                  value={car.year || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1900"
                  max="2025"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Car Video (Optional)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">Upload a new video file to replace existing video (MP4, AVI, MOV - Max 50MB)</p>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/15 text-slate-300 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
              />
              {car.video_url && !videoPreview && (
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-1">Current Video:</p>
                  <video src={car.video_url} controls className="w-full max-w-sm rounded-xl border border-white/10" />
                </div>
              )}
              {videoPreview && (
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-1">New Video Preview:</p>
                  <video src={videoPreview} controls className="w-full max-w-sm rounded-xl border border-white/10" />
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Primary Image URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="url"
                name="image_url"
                placeholder="https://example.com/car-image.jpg"
                value={car.image_url || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Additional Images (Optional)
              </label>
              <div className="space-y-2">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    type="url"
                    name={`additional_image_${index}`}
                    placeholder={`Additional image ${index + 1} URL`}
                    value={car.additional_images?.[index] || ''}
                    onChange={(e) => {
                      const newAdditionalImages = [...(car.additional_images || [])];
                      newAdditionalImages[index] = e.target.value;
                      setCar({ ...car, additional_images: newAdditionalImages });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4 pt-6 border-t border-white/10">
              <button 
                type="submit" 
                className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all text-xs shadow-md cursor-pointer"
              >
                Update Car
              </button>
              <button 
                type="button" 
                className="px-6 py-3 rounded-xl font-semibold text-slate-400 hover:text-white bg-white/5 transition-all text-xs cursor-pointer" 
                onClick={() => router.push('/seller-dashboard')}
              >
                Cancel
              </button>
            </div>
            
            {message && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold border ${message.startsWith('✅') ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/60 border-rose-500/30 text-rose-300'}`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
