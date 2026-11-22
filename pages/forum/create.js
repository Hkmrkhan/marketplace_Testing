import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function CreateDiscussion() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cars, setCars] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    car_id: ''
  });
  const router = useRouter();
  
  useEffect(() => {
    const { car_id, car_title } = router.query;
    if (car_id && car_title) {
      setFormData(prev => ({
        ...prev,
        car_id: car_id,
        title: `Discussion about ${car_title}`
      }));
    }
  }, [router.query]);

  useEffect(() => {
    fetchUser();
    fetchCars();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setUser(user);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();
    setUserProfile(profile);
    
    setLoading(false);
  };

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id, title, price, image_url')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.car_id) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('car_discussions')
        .insert({
          car_id: formData.car_id,
          user_id: user.id,
          title: formData.title.trim(),
          content: formData.content.trim()
        })
        .select()
        .single();

      if (error) throw error;

      if (data && data.id) {
        alert('✅ Discussion created successfully! Redirecting to forum...');
        router.push('/forum');
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
      alert('Error creating discussion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (userProfile?.user_type === 'admin') {
      window.location.href = '/admin-dashboard';
    } else if (userProfile?.user_type === 'seller') {
      window.location.href = '/seller-dashboard';
    } else if (userProfile?.user_type === 'buyer') {
      window.location.href = '/buyer-dashboard';
    } else {
      router.push('/forum');
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button 
          onClick={goBack} 
          className="mb-6 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
        >
          ← Back
        </button>

        <div className="rounded-3xl backdrop-blur-2xl bg-slate-900/80 border border-white/10 p-6 sm:p-10 shadow-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Start a New Discussion</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Share your thoughts, ask questions, or discuss cars with the community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="car_id" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Select Car to Discuss
              </label>
              <select
                id="car_id"
                name="car_id"
                value={formData.car_id}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a car...</option>
                {cars.map(car => (
                  <option key={car.id} value={car.id}>
                    {car.title} - ${car.price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Discussion Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Is this car good for family use?"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={200}
              />
              <span className="block text-right text-[11px] text-slate-500 mt-1">{formData.title.length}/200 characters</span>
            </div>

            <div>
              <label htmlFor="content" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Discussion Content
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Share your thoughts, ask questions, or provide details..."
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={8}
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/10">
              <button
                type="submit"
                className="px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all cursor-pointer text-sm"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Discussion'}
              </button>
              <button
                type="button"
                onClick={goBack}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
