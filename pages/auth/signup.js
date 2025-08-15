import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import styles from '../../styles/Auth.module.css';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState('buyer');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch user profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        if (profile) {
          console.log('User already logged in:', profile.user_type);
          
          // Redirect based on user type
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
      
      console.log('Starting signup process for user type:', userType);
      
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
        console.error('Auth signup error:', error);
        setMessage('❌ ' + error.message);
        setLoading(false);
        return;
      }

      // Create profile manually
      if (data.user) {
        console.log('User created successfully:', data.user.id);
        console.log('Creating profile with user type:', userType);
        
        // Create profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            full_name: fullName,
            email: email,
            user_type: userType
          }])
          .select();
          
        if (profileError) {
          console.error('Profile creation error:', profileError);
          setMessage('❌ Failed to create profile: ' + profileError.message);
          setLoading(false);
          return;
        }

        console.log('Profile created successfully:', profileData);

        // Handle different user types
        if (userType === 'seller') {
          console.log('Setting up seller account...');
          
          try {
            // Call existing Stripe account creation API
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
            console.log('Stripe API response:', stripeData);
            
            if (response.ok && stripeData.accountId) {
              console.log('✅ Stripe Connect account created successfully:', stripeData.accountId);
              setMessage('✅ Account created! Setting up payment system...');
              
              // Wait for database update to complete
              setTimeout(() => {
                console.log('Redirecting to Stripe onboarding...');
                window.location.href = stripeData.onboardingUrl;
              }, 3000);
              return;
            } else {
              console.error('Stripe account creation failed:', stripeData.error);
              setMessage('⚠️ Account created but payment setup failed. You can complete it later.');
              
              // Still redirect to dashboard even if Stripe fails
              setTimeout(() => {
                router.push('/seller-dashboard');
              }, 2000);
              return;
            }
          } catch (stripeError) {
            console.error('Stripe API error:', stripeError);
            setMessage('⚠️ Account created but payment setup failed. You can complete it later.');
            
            // Still redirect to dashboard even if Stripe fails
            setTimeout(() => {
              router.push('/seller-dashboard');
            }, 2000);
            return;
          }
        } else {
          // For buyer, redirect to dashboard
          setMessage('✅ Account created successfully! Redirecting...');
          
          setTimeout(() => {
            router.push('/buyer-dashboard');
          }, 2000);
        }
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('Signup error:', err);
      setMessage('❌ ' + err.message);
      setLoading(false);
    }
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
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '5px', 
              marginBottom: '20px',
              fontSize: '14px',
              color: '#666',
              border: '1px solid #e9ecef'
            }}>
              <span style={{color: 'red'}}>*</span> Required fields
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="fullName">Full Name <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={styles.input}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email <span style={{color: 'red'}}>*</span></label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password">Password <span style={{color: 'red'}}>*</span></label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password <span style={{color: 'red'}}>*</span></label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={styles.input}
                disabled={loading}
              />
            </div>
            {/* User Type Selection */}
            <div className={styles.userTypeSelector}>
              <label className={styles.radioCard}>
                <input
                  type="radio"
                  name="userType"
                  value="buyer"
                  checked={userType === 'buyer'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <h3>Buyer</h3>
              </label>
              
              <label className={styles.radioCard}>
                <input
                  type="radio"
                  name="userType"
                  value="seller"
                  checked={userType === 'seller'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <h3>Seller</h3>
              </label>
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
