import { useState, useEffect } from 'react';
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkExistingUser();
  }, []);

  const checkExistingUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          if (profile.user_type === 'seller') {
            router.replace('/seller-dashboard');
          } else if (profile.user_type === 'admin') {
            router.replace('/admin-dashboard');
          } else {
            router.replace('/buyer-dashboard');
          }
        }
      }
    } catch (error) {
      console.error('Error checking existing user:', error);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    
    try {
      if (!email) {
        setMessage('❌ Please enter your email address.');
        setLoading(false);
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        setMessage('❌ Please enter a valid email address.');
        setLoading(false);
        return;
      }

      if (email.includes('..') || email.startsWith('.') || email.endsWith('.') || 
          email.includes('@.') || email.includes('.@') || email.length < 5) {
        setMessage('❌ Please enter a valid email address.');
        setLoading(false);
        return;
      }

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : 'http://localhost:3000/auth/reset-password',
        });

        if (error) {
          if (error.message.includes('invalid') || error.message.includes('Email address')) {
            setMessage('❌ Please enter a valid email address.');
          } else if (error.message.includes('rate limit')) {
            setMessage('❌ Too many attempts. Please try again later.');
          } else {
            setMessage('❌ Failed to send reset email. Please try again.');
          }
          setLoading(false);
          return;
        }

        setResetEmailSent(true);
        setMessage('✅ Password reset instructions sent to your email.');
      } catch (authError) {
        setMessage('❌ Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setMessage('❌ Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    
    try {
      if (!email || !password) {
        setMessage('❌ Please fill in all fields.');
        setLoading(false);
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        setMessage('❌ Please enter a valid email address.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setMessage('❌ Invalid email or password. Please try again.');
          } else if (error.message.includes('Email not confirmed')) {
            setMessage('❌ Please confirm your email address before logging in.');
          } else if (error.message.includes('rate limit')) {
            setMessage('❌ Too many login attempts. Please try again later.');
          } else {
            setMessage('❌ Login failed. Please check your credentials and try again.');
          }
          setLoading(false);
          return;
        }
      } catch (apiError) {
        setMessage('❌ Login failed. Please check your credentials and try again.');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('❌ Login failed. User not found.');
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        setMessage('❌ Profile not found. Please contact support.');
        setLoading(false);
        return;
      }

      if (profile.account_status === 'revoked') {
        setMessage('❌ Your account has been revoked. Please contact support for assistance.');
        setLoading(false);
        setShowContactPopup(true);
        return;
      }

      if (profile.user_type === 'seller') {
        router.push('/seller-dashboard');
      } else if (profile.user_type === 'admin') {
        router.push('/admin-dashboard');
      } else {
        router.push('/buyer-dashboard');
      }

    } catch (err) {
      if (err.message && (err.message.includes('invalid') || err.message.includes('Invalid login credentials'))) {
        setMessage('❌ Invalid email or password. Please try again.');
      } else {
        setMessage('❌ Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#070b14] relative overflow-hidden">
      
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl backdrop-blur-2xl bg-slate-900/80 border border-white/10 shadow-2xl overflow-hidden">

        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {forgotPasswordMode ? 'Reset Password' : 'Sign In'}
              </h1>
              <p className="text-slate-400 text-sm mt-2">
                {forgotPasswordMode 
                  ? 'Enter your email to receive password reset instructions' 
                  : 'Access your account to buy, sell, or manage cars'}
              </p>
            </div>

            <form onSubmit={forgotPasswordMode ? handleForgotPassword : handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  disabled={loading}
                />
              </div>
              
              {!forgotPasswordMode && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-3.5 pr-12 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
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
              )}
              
              <button 
                type="submit" 
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.99] transition-all cursor-pointer text-sm"
                disabled={loading}
              >
                {loading 
                  ? (forgotPasswordMode ? 'Sending...' : 'Signing In...') 
                  : (forgotPasswordMode ? 'Send Reset Email' : 'Login')
                }
              </button>
            </form>

            {!forgotPasswordMode && !resetEmailSent && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setForgotPasswordMode(true)}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {forgotPasswordMode && !resetEmailSent && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setMessage('');
                  }}
                  className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  ← Back to Login
                </button>
              </div>
            )}

            {resetEmailSent && (
              <div className="mt-6 p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="text-base font-bold text-white">Check Your Email</h3>
                <p className="text-xs text-slate-300 mt-1 mb-4">We've sent a password reset link to <strong>{email}</strong></p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setResetEmailSent(false);
                    setMessage('');
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  ← Back to Login
                </button>
              </div>
            )}

            {message && (
              <div className={`mt-4 p-3.5 rounded-xl text-xs font-medium border ${message.startsWith('✅') ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/50 border-rose-500/30 text-rose-300'}`}>
                {message}
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-slate-400">
            Don't have an account? <a href="/auth/signup" className="text-indigo-400 font-semibold hover:text-indigo-300 underline ml-1">Sign Up</a>
          </div>
        </div>

        <div className="lg:col-span-5 relative bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-950 p-8 sm:p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10">
          <div>
            <div className="relative rounded-2xl overflow-hidden mb-8 border border-white/10 shadow-xl">
              <img src="/carp5.webp" alt="Car Marketplace" className="w-full h-48 object-cover" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">Welcome Back!</h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Sign in to access your dashboard, buy or sell cars, and manage your listings on our secure marketplace.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl backdrop-blur-md bg-white/[0.06] border border-white/10 flex items-center gap-3">
                <span className="text-xl">🛒</span>
                <span className="text-xs font-semibold text-white">Buyers</span>
              </div>
              <div className="p-3.5 rounded-xl backdrop-blur-md bg-white/[0.06] border border-white/10 flex items-center gap-3">
                <span className="text-xl">🏪</span>
                <span className="text-xs font-semibold text-white">Sellers</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {showContactPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-lg font-bold text-rose-400">🚫 Account Revoked</h3>
              <button 
                onClick={() => setShowContactPopup(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 text-xs text-slate-300">
              <p>Your account has been suspended by our administrators.</p>
              <p className="font-semibold text-white">To restore access, please contact support:</p>
              <div className="p-3 rounded-xl bg-slate-950 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span>📧 Email:</span>
                  <span className="font-medium text-white">hkmrKhan10@gmail.com</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>📱 WhatsApp:</span>
                  <span className="font-medium text-white">+923208196396</span>
                </div>
              </div>
              <button 
                onClick={() => setShowContactPopup(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
