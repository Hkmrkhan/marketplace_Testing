import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';

const EyeIcon = ({ show }) => (
  show ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
);

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState('buyer');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          if (profile.user_type === 'seller') {
            router.replace('/seller-dashboard');
          } else {
            router.replace('/buyer-dashboard');
          }
        }
      }
    };
    
    checkUser();
  }, [router]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage('❌ Please select an image file (PNG, JPG, JPEG, GIF)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage('❌ File size must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setMessage('');
    }
  };

  const uploadAvatar = async (userId) => {
    if (!avatarFile) return null;

    try {
      setUploadingAvatar(true);
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Avatar upload failed:', error);
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    
    try {
      if (!email || !password || !fullName) {
        setMessage('❌ Please fill in all required fields.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setMessage('❌ Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setMessage('❌ Passwords do not match.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType
          }
        }
      });
      
      if (error) {
        setMessage('❌ ' + error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        let avatarUrl = null;
        if (avatarFile) {
          try {
            setMessage('📸 Uploading profile picture...');
            avatarUrl = await uploadAvatar(data.user.id);
          } catch (avatarError) {
            avatarUrl = null;
          }
        }
        
        const profileData = {
          id: data.user.id,
          full_name: fullName,
          email: email,
          user_type: userType
        };
        
        if (avatarUrl) {
          profileData.avatar_url = avatarUrl;
        }
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileData])
          .select();
          
        if (profileError) {
          setMessage('❌ Failed to create profile: ' + profileError.message);
          setLoading(false);
          return;
        }

        if (userType === 'seller') {
          try {
            const response = await fetch('/api/create-stripe-account', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: data.user.id,
                userEmail: email,
                country: 'US'
              })
            });

            const stripeData = await response.json();
            if (response.ok && stripeData.accountId) {
              setMessage('✅ Account created! Setting up payment system...');
              setTimeout(() => {
                window.location.href = stripeData.onboardingUrl;
              }, 3000);
              return;
            } else {
              setMessage('⚠️ Account created! Redirecting to seller dashboard...');
              setTimeout(() => {
                router.push('/seller-dashboard');
              }, 2000);
              return;
            }
          } catch (stripeError) {
            setMessage('⚠️ Account created! Redirecting...');
            setTimeout(() => {
              router.push('/seller-dashboard');
            }, 2000);
            return;
          }
        } else {
          setMessage('✅ Account created successfully! Redirecting...');
          setTimeout(() => {
            router.push('/buyer-dashboard');
          }, 2000);
        }
      }
      
      setLoading(false);
    } catch (err) {
      setMessage('❌ ' + err.message);
      setLoading(false);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#070b14] relative overflow-hidden">
      
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl backdrop-blur-2xl bg-slate-900/80 border border-white/10 shadow-2xl overflow-hidden">

        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Join Car Marketplace
              </h1>
              <p className="text-slate-400 text-sm mt-2">
                Create your account to start buying or selling cars
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Profile Picture (Optional)
              </label>
              <div className="flex items-center gap-4">
                {avatarPreview ? (
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-md">
                    <img src={avatarPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={removeAvatar}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-2xl border border-dashed border-white/20 hover:border-indigo-500 bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-colors"
                  >
                    <span className="text-lg">📷</span>
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer block"
                  >
                    {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, JPEG up to 5MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="fullName">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="email">
                  Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="password">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="confirmPassword">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon show={showConfirmPassword} />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-950/70 border border-white/10">
                  <label 
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl cursor-pointer font-semibold text-sm transition-all ${
                      userType === 'buyer'
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value="buyer"
                      checked={userType === 'buyer'}
                      onChange={(e) => setUserType(e.target.value)}
                      className="hidden"
                    />
                    <span>🛒 Buyer</span>
                  </label>
                  
                  <label 
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl cursor-pointer font-semibold text-sm transition-all ${
                      userType === 'seller'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value="seller"
                      checked={userType === 'seller'}
                      onChange={(e) => setUserType(e.target.value)}
                      className="hidden"
                    />
                    <span>🏪 Seller</span>
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full mt-2 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.99] transition-all cursor-pointer text-sm"
                disabled={loading || uploadingAvatar}
              >
                {loading ? 'Creating Account...' : uploadingAvatar ? 'Uploading...' : 'Create Account'}
              </button>
            </form>

            {message && (
              <div className={`mt-4 p-3.5 rounded-xl text-xs font-medium border ${message.startsWith('✅') ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/50 border-rose-500/30 text-rose-300'}`}>
                {message}
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-slate-400">
            Already have an account? <a href="/auth/login" className="text-indigo-400 font-semibold hover:text-indigo-300 underline ml-1">Sign In</a>
          </div>
        </div>

        <div className="lg:col-span-5 relative bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-950 p-8 sm:p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10">
          <div>
            <div className="relative rounded-2xl overflow-hidden mb-8 border border-white/10 shadow-xl">
              <img src="/carp5.webp" alt="Join Car Marketplace" className="w-full h-48 object-cover" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">Welcome to the Marketplace!</h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Join thousands of buyers and sellers. List your car, find your dream ride, and enjoy a secure, trusted platform for all your automotive needs.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl backdrop-blur-md bg-white/[0.06] border border-white/10 flex items-center gap-3">
                <span className="text-lg">🛡️</span>
                <span className="text-xs text-slate-200">100% Verified Sellers & Listings</span>
              </div>
              <div className="p-3.5 rounded-xl backdrop-blur-md bg-white/[0.06] border border-white/10 flex items-center gap-3">
                <span className="text-lg">⚡</span>
                <span className="text-xs text-slate-200">Instant AI-Powered Car Assistance</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
