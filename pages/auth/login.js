import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import styles from '../../styles/Auth.module.css';

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
        // Fetch user profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          console.log('User already logged in:', profile.user_type);
          
          // Redirect based on user type
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

      // Enhanced email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        setMessage('❌ Please enter a valid email address.');
        setLoading(false);
        return;
      }

      // Additional validation for common invalid patterns
      if (email.includes('..') || email.startsWith('.') || email.endsWith('.') || 
          email.includes('@.') || email.includes('.@') || email.length < 5) {
        setMessage('❌ Please enter a valid email address.');
        setLoading(false);
        return;
      }

      console.log('Sending password reset email to:', email);

      try {
        // Supabase password reset with localhost redirect
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'http://localhost:3000/auth/reset-password',
        });

        if (error) {
          console.error('Password reset error:', error);
          // Better error handling without showing code
          if (error.message.includes('invalid') || error.message.includes('Email address')) {
            setMessage('❌ Please enter a valid email address.');
          } else if (error.message.includes('rate limit')) {
            setMessage('❌ Too many attempts. Please try again later.');
          } else if (error.message.includes('not found')) {
            setMessage('❌ Email not found. Please check your email address.');
          } else {
            setMessage('❌ Unable to send reset email. Please try again.');
          }
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // Handle any API-level errors
        setMessage('❌ Please enter a valid email address.');
        setLoading(false);
        return;
      }

      setMessage('✅ Password reset email sent! Check your inbox.');
      setResetEmailSent(true);
      setLoading(false);
    } catch (err) {
      console.error('Unexpected password reset error:', err);
      // Generic error message without showing technical details
      if (err.message && err.message.includes('invalid')) {
        setMessage('❌ Please enter a valid email address.');
      } else {
        setMessage('❌ Password reset failed. Please try again.');
      }
      setLoading(false);
    }
  };

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

      console.log('Attempting login for email:', email);

      try {
        // Supabase Auth login
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });

        if (error) {
          console.error('Login error:', error);
          // Better error handling without showing code
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
        console.error('Login API error:', apiError);
        // Handle any API-level errors
        setMessage('❌ Login failed. Please check your credentials and try again.');
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

      console.log('User authenticated successfully:', user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        setMessage('❌ Profile not found. Please contact support.');
        setLoading(false);
        return;
      }

      console.log('Profile loaded:', profile.user_type);

      // Check if account is revoked
      if (profile.account_status === 'revoked') {
        console.log('Account is revoked, showing notification');
        setMessage('❌ Your account has been revoked. Please contact support for assistance.');
        setLoading(false);
        
        // Show contact popup
        setShowContactPopup(true);
        return;
      }

      // Redirect based on user_type
      if (profile.user_type === 'seller') {
        console.log('Redirecting to seller dashboard');
        router.push('/seller-dashboard');
      } else if (profile.user_type === 'admin') {
        console.log('Redirecting to admin dashboard');
        router.push('/admin-dashboard');
      } else {
        console.log('Redirecting to buyer dashboard');
        router.push('/buyer-dashboard');
      }

    } catch (err) {
      console.error('Unexpected login error:', err);
      // Generic error message without showing technical details
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
    <main className={styles.authContainer}>
      <div className={styles.authCardWithGraphic}>
        <div className={styles.authCardLeft}>
          <div className={styles.authHeader}>
            <h1>Sign In</h1>
            <p>Access your account to buy, sell, or manage cars</p>
          </div>
          <form onSubmit={forgotPasswordMode ? handleForgotPassword : handleLogin} className={styles.authForm}>
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
            
            {!forgotPasswordMode && (
              <div className={styles.formGroup}>
                <label>Password</label>
                <div className={styles.passwordInputContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={styles.input}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            )}
            
            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading 
                ? (forgotPasswordMode ? 'Sending...' : 'Signing In...') 
                : (forgotPasswordMode ? 'Send Reset Email' : 'Login')
              }
            </button>
          </form>

          {/* Forgot Password Link */}
          {!forgotPasswordMode && !resetEmailSent && (
            <div className={styles.forgotPasswordLink}>
              <button
                type="button"
                onClick={() => setForgotPasswordMode(true)}
                className={styles.forgotPasswordBtn}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Back to Login Link */}
          {forgotPasswordMode && !resetEmailSent && (
            <div className={styles.backToLoginLink}>
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordMode(false);
                  setMessage('');
                }}
                className={styles.backToLoginBtn}
              >
                ← Back to Login
              </button>
            </div>
          )}

          {/* Reset Email Sent Success */}
          {resetEmailSent && (
            <div className={styles.resetEmailSent}>
              <div className={styles.successIcon}>✅</div>
              <h3>Check Your Email</h3>
              <p>We've sent a password reset link to <strong>{email}</strong></p>
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordMode(false);
                  setResetEmailSent(false);
                  setMessage('');
                }}
                className={styles.backToLoginBtn}
              >
                ← Back to Login
              </button>
            </div>
          )}
          {message && (
            <div className={`${styles.message} ${message.startsWith('✅') ? styles.success : styles.error}`}>
              {message}
            </div>
          )}

          {/* Contact Popup for Revoked Accounts */}
          {showContactPopup && (
            <div className={styles.contactPopup}>
              <div className={styles.contactPopupContent}>
                <div className={styles.contactPopupHeader}>
                  <h3>🚫 Account Revoked</h3>
                  <button 
                    onClick={() => setShowContactPopup(false)}
                    className={styles.closePopupBtn}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.contactPopupBody}>
                  <p>Your account has been suspended by our administrators.</p>
                  <p><strong>To restore access, please contact support:</strong></p>
                  <div className={styles.contactInfo}>
                    <div className={styles.contactItem}>
                      <span>📧 Email:</span>
                      <span>hkmrkhan</span>
                    </div>
                    <div className={styles.contactItem}>
                      <span>📱 WhatsApp:</span>
                      <span>+92 300 1234567</span>
                    </div>
                    <div className={styles.contactItem}>
                      <span>🌐 Website:</span>
                      <span>www.carmarketplace.com/contact</span>
                    </div>
                  </div>
                  <div className={styles.contactActions}>
                    <button 
                      onClick={() => setShowContactPopup(false)}
                      className={styles.contactCloseBtn}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
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
            <div className={styles.userTypes}>
              <div className={styles.userType}>
                <span className={styles.userTypeIcon}>🛒</span>
                <span>Buyers</span>
              </div>
              <div className={styles.userType}>
                <span className={styles.userTypeIcon}>🏪</span>
                <span>Sellers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
