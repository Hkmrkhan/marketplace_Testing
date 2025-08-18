import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import styles from '../../styles/Auth.module.css';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated (should be after clicking reset link)
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('❌ Invalid or expired reset link. Please try again.');
        return;
      }
      setUser(user);
    };
    
    checkUser();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    
    try {
      if (!password || !confirmPassword) {
        setMessage('❌ Please fill in all fields.');
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

      console.log('Resetting password for user:', user?.id);

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        setMessage('❌ ' + error.message);
        setLoading(false);
        return;
      }

      setMessage('✅ Password updated successfully! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
      
    } catch (err) {
      console.error('Unexpected password reset error:', err);
      setMessage('❌ Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1>Reset Password</h1>
            <p>Invalid or expired reset link</p>
          </div>
          {message && (
            <div className={`${styles.message} ${styles.error}`}>
              {message}
            </div>
          )}
          <div className={styles.authFooter}>
            <p><a href="/auth/login">Go to Login</a></p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1>Reset Your Password</h1>
          <p>Enter your new password below</p>
        </div>
        
        <form onSubmit={handleResetPassword} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label>New Password</label>
            <div className={styles.passwordInputContainer}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={styles.input}
                disabled={loading}
                minLength="6"
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
          
          <div className={styles.formGroup}>
            <label>Confirm New Password</label>
            <div className={styles.passwordInputContainer}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={styles.input}
                disabled={loading}
                minLength="6"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
        
        {message && (
          <div className={`${styles.message} ${message.startsWith('✅') ? styles.success : styles.error}`}>
            {message}
          </div>
        )}
        
        <div className={styles.authFooter}>
          <p><a href="/auth/login">Back to Login</a></p>
        </div>
      </div>
    </main>
  );
}

