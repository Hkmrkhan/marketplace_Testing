import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarForm from '../components/CarForm';
import { supabase } from '../utils/supabaseClient';
import styles from '../styles/AddCar.module.css';

export default function AddCarPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
      
      // Fetch profile to check user_type
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
      
      // Check if user is a seller
      if (profile?.user_type !== 'seller') {
        setMessage('❌ Only sellers can add cars. Please login as a seller.');
        setLoading(false);
        return;
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const handleAddCar = async (car, resetForm) => {
    if (!user || userProfile?.user_type !== 'seller') {
      setMessage('❌ Only sellers can add cars.');
      return;
    }

    setLoading(true);
    try {
      console.log('Adding car with data:', {
        user_id: user.id,
        seller_id: user.id,
        title: car.title,
        description: car.description,
        price: parseFloat(car.price),
        images: car.images, // Now handling multiple images
        status: 'available'
      });

      // Add car to Supabase with seller_id and multiple images
      const { data, error } = await supabase
        .from('cars')
        .insert([
          {
            user_id: user.id,
            seller_id: user.id, // Add seller_id
            title: car.title,
            description: car.description,
            price: parseFloat(car.price),
            miles: car.miles ? parseInt(car.miles) : 0,
            reg_district: car.reg_district || 'Other',
            year: car.year ? parseInt(car.year) : 2020,
            image_url: car.images[0], // Primary image (first one)
            additional_images: car.images.slice(1), // Additional images as array
            status: 'available'
          }
        ])
        .select();

      console.log('Add car response:', { data, error });

      if (error) {
        console.error('Error adding car:', error);
        setMessage('❌ Error adding car: ' + error.message);
      } else {
        console.log('Car added successfully:', data);
        setMessage('✅ Car added successfully! Redirecting to dashboard...');
        resetForm();
        // Redirect to seller dashboard after 2 seconds
        setTimeout(() => {
          router.push('/seller-dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('❌ Error adding car: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}>Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (userProfile?.user_type !== 'seller') {
    return (
      <div>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.errorMessage}>
              <h1>❌ Access Denied</h1>
              <p>Only sellers can add cars. Please login as a seller.</p>
              <button onClick={() => router.push('/auth/login')} className={styles.backBtn}>
                Go to Login
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <img src="/graphic1.webp" alt="Add Car" className={styles.headerImage} />
            <div className={styles.headerText}>
              <h1>Add Your Car</h1>
              <p>List your car and reach thousands of potential buyers</p>
            </div>
          </div>
          
          <div className={styles.formSection}>
            <CarForm 
              onSubmit={handleAddCar} 
              onCancel={() => router.push('/seller-dashboard')}
            />
            {message && (
              <div className={`${styles.message} ${message.startsWith('✅') ? styles.success : styles.error}`}>
                {message}
              </div>
            )}
          </div>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <img src="/graphic2.webp" alt="Easy Listing" className={styles.featureImage} />
              <h3>Easy Listing</h3>
              <p>Upload your car details in minutes</p>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📱</span>
              <h3>Reach More Buyers</h3>
              <p>Connect with thousands of potential customers</p>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>💰</span>
              <h3>Best Prices</h3>
              <p>Get the best value for your car</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
