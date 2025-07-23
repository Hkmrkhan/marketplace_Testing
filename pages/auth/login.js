import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import styles from '../../styles/Auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        // Fetch user profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile?.user_type === 'seller') {
          router.replace('/seller-dashboard');
        } else {
          router.replace('/buyer-dashboard');
        }
      }
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      if (!email || !password) {
        setMessage('❌ Please enter both email and password.');
        setLoading(false);
        return;
      }
      // Supabase Auth login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage('❌ ' + error.message);
        setLoading(false);
        return;
      }
      // Fetch user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('❌ Login failed. User not found.');
        setLoading(false);
        return;
      }
      const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileError || !profile) {
        setMessage('❌ Profile not found.');
        setLoading(false);
        return;
      }
      // Redirect based on user_type
          if (profile.user_type === 'seller') {
            router.push('/seller-dashboard');
      } else {
        router.push('/buyer-dashboard');
      }
    } catch (err) {
      setMessage('❌ Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.authContainer}>
      <div className={styles.authCardWithGraphic}>
        <div className={styles.authCardLeft}>
        <div className={styles.authHeader}>
          <h1>Sign In</h1>
          <p>Access your account to buy or sell cars</p>
        </div>
        <form onSubmit={handleLogin} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input}
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.input}
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Login'}
          </button>
        </form>
        {message && (
          <div className={`${styles.message} ${message.startsWith('✅') ? styles.success : styles.error}`}>
            {message}
          </div>
        )}
        <div className={styles.authFooter}>
          <p>Don't have an account? <a href="/auth/signup">Sign Up</a></p>
          </div>
        </div>
        <div className={styles.authCardRight}>
          <img src="/carp5.png" alt="Car Marketplace" className={styles.signupGraphic} />
          <div className={styles.signupText}>
            <h2>Welcome Back!</h2>
            <p>Sign in to access your dashboard, buy or sell cars, and manage your listings on our secure marketplace.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
