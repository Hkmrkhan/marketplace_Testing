import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import styles from '../../styles/Auth.module.css';

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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('❌ Please select an image file (PNG, JPG, JPEG, GIF)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('❌ File size must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setMessage(''); // Clear any previous error messages
    }
  };

  const uploadAvatar = async (userId) => {
    if (!avatarFile) return null;

    try {
      setUploadingAvatar(true);
      
      // Create unique filename
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      console.log('🔄 Starting avatar upload...', { filePath, fileSize: avatarFile.size });

      // Check if storage bucket exists first
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.error('❌ Error checking buckets:', bucketError);
        throw new Error('Storage service unavailable');
      }

      const userAvatarsBucket = buckets.find(bucket => bucket.id === 'user-avatars');
      if (!userAvatarsBucket) {
        console.error('❌ user-avatars bucket not found');
        throw new Error('Avatar storage not configured. Please contact support.');
      }

      console.log('✅ Storage bucket found:', userAvatarsBucket);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        throw error;
      }

      console.log('✅ File uploaded successfully:', data);

      // Get public URL manually (Supabase storage issue fix)
      // Extract project ref from Supabase URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fdddzfnawuykljrdrlrp.supabase.co';
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'fdddzfnawuykljrdrlrp';
      const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/user-avatars/${filePath}`;

      console.log('✅ Public URL generated manually:', publicUrl);

      return publicUrl;

    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      
      // Provide more specific error messages
      if (error.message.includes('bucket')) {
        throw new Error('Avatar storage not configured. Please contact support.');
      } else if (error.message.includes('permission')) {
        throw new Error('Permission denied. Please try again or contact support.');
      } else if (error.message.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
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
        
        let avatarUrl = null;
        
        // Upload avatar if selected
        if (avatarFile) {
          try {
            setMessage('📸 Uploading profile picture...');
            avatarUrl = await uploadAvatar(data.user.id);
            setMessage('✅ Profile picture uploaded! Creating account...');
          } catch (avatarError) {
            console.error('Avatar upload error:', avatarError);
            // Continue with signup even if avatar fails
            setMessage('⚠️ Account created but profile picture upload failed. You can add it later.');
            avatarUrl = null; // Ensure avatarUrl is null if upload fails
          }
        }
        
        // Create profile with avatar URL
        const profileData = {
          id: data.user.id,
          full_name: fullName,
          email: email,
          user_type: userType
        };
        
        if (avatarUrl) {
          profileData.avatar_url = avatarUrl;
        }
        
        const { data: profileDataResult, error: profileError } = await supabase
          .from('profiles')
          .insert([profileData])
          .select();
          
        if (profileError) {
          console.error('Profile creation error:', profileError);
          setMessage('❌ Failed to create profile: ' + profileError.message);
          setLoading(false);
          return;
        }

        console.log('Profile created successfully:', profileDataResult);

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

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          
          {/* Profile Picture Uploader */}
          <div className={styles.avatarSection}>
            <label className={styles.avatarLabel}>Profile Picture (Optional)</label>
            <div className={styles.avatarUploader}>
              {avatarPreview ? (
                <div className={styles.avatarPreview}>
                  <img src={avatarPreview} alt="Profile Preview" />
                  <button 
                    type="button" 
                    onClick={removeAvatar}
                    className={styles.removeAvatarBtn}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div 
                  className={styles.avatarPlaceholder}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span>📷</span>
                  <p>Click to add photo</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
            <p className={styles.avatarHelp}>PNG, JPG, JPEG, GIF up to 5MB</p>
          </div>

          <form onSubmit={handleSignup} className={styles.authForm}>
            <div style={{ 
              backgroundColor: '#f1f5f9', 
              padding: '10px', 
              borderRadius: '5px', 
              marginBottom: '20px',
              fontSize: '14px',
              color: '#64748b',
              border: '1px solid #e2e8f0'
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
              <div className={styles.passwordInputContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.input}
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon show={showPassword} />
                </button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password <span style={{color: 'red'}}>*</span></label>
              <div className={styles.passwordInputContainer}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={styles.input}
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon show={showConfirmPassword} />
                </button>
              </div>
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
              disabled={loading || uploadingAvatar}
            >
              {loading ? 'Creating Account...' : uploadingAvatar ? 'Uploading...' : 'Create Account'}
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
