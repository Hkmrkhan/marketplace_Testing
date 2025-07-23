import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import styles from '../../styles/Auth.module.css';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState('buyer');
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    
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
      
    // Supabase Auth signup
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
      
    setMessage('✅ Account created! Redirecting to your dashboard...');
          setTimeout(() => {
            if (userType === 'seller') {
              router.push('/seller-dashboard');
            } else {
              router.push('/buyer-dashboard');
            }
    }, 1200);
      setLoading(false);
  };

  return (
    <main className={styles.authContainer}>
      <div className={styles.authCardWithGraphic}>
        <div className={styles.authCardLeft}>
          <div className={styles.authHeader}>
            <h1>Join Car Marketplace</h1>
            <p>Create your account to start buying or selling cars</p>
          </div>
          <form onSubmit={handleSignup} className={styles.authForm}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className={styles.input}
                disabled={loading}
              />
            </div>
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
                placeholder="Create a strong password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={styles.input}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label>I want to:</label>
              <div className={styles.userTypeSelector}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="userType"
                    value="buyer"
                    checked={userType === 'buyer'}
                    onChange={e => setUserType(e.target.value)}
                    className={styles.radioInput}
                    disabled={loading}
                  />
                  <div className={styles.radioCard}>
                    <h3>Buy Cars</h3>
                    <p>Browse and purchase cars from sellers</p>
                  </div>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="userType"
                    value="seller"
                    checked={userType === 'seller'}
                    onChange={e => setUserType(e.target.value)}
                    className={styles.radioInput}
                    disabled={loading}
                  />
                  <div className={styles.radioCard}>
                    <h3>Sell Cars</h3>
                    <p>List your cars and reach buyers</p>
                  </div>
                </label>
              </div>
            </div>
            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          {message && (
            <div className={`${styles.message} ${message.startsWith('✅') ? styles.success : styles.error}`}>
              {message}
            </div>
          )}
          <div className={styles.authFooter}>
            <p>Already have an account? <a href="/auth/login">Sign In</a></p>
          </div>
        </div>
        <div className={styles.authCardRight}>
          <img src="/carp5.png" alt="Join Car Marketplace" className={styles.signupGraphic} />
          <div className={styles.signupText}>
            <h2>Welcome to the Marketplace!</h2>
            <p>Join thousands of buyers and sellers. List your car, find your dream ride, and enjoy a secure, trusted platform for all your automotive needs.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
