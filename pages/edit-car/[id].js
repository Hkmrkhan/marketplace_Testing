import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import styles from '../../styles/CarForm.module.css';
import { supabase } from '../../utils/supabaseClient';

export default function EditCarPage() {
  const router = useRouter();
  const { id } = router.query;
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserAndCar = async () => {
      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        router.push('/auth/login');
        return;
      }
      setUser(user);
      // Get user profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
      // Fetch car from Supabase
      const { data: carData, error } = await supabase.from('cars').select('*').eq('id', id).single();
      if (error || !carData) {
        setCar(null);
        setLoading(false);
        return;
      }
      // Only allow if current user is the seller/owner
      if (carData.user_id !== user.id) {
        setCar(null);
        setLoading(false);
        setMessage('You are not authorized to edit this car.');
        return;
      }
      setCar(carData);
      setLoading(false);
    };
    if (id) fetchUserAndCar();
  }, [id, router]);

  const handleChange = (e) => {
    setCar({ ...car, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!car) {
      setMessage('Car not found.');
      return;
    }
    // Update car in Supabase
    const { error } = await supabase.from('cars').update({
      title: car.title,
      description: car.description,
      price: car.price,
      image_url: car.image_url
    }).eq('id', car.id);
    if (error) {
      setMessage('Failed to update car: ' + error.message);
      return;
    }
    setMessage('Car updated successfully!');
    setTimeout(() => router.push('/seller-dashboard'), 1500);
  };

  if (loading) return <div>Loading...</div>;
  if (!car) return <div>{message || 'Car not found.'}</div>;

  return (
    <div>
      <Navbar />
      <main className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h2>Edit Car Details</h2>
          <p>Update your car information below</p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Car Title</label>
            <input
              type="text"
              name="title"
              value={car.title || ''}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              name="description"
              value={car.description || ''}
              onChange={handleChange}
              className={styles.textarea}
              rows="4"
              required
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Price ($)</label>
              <input
                type="number"
                name="price"
                value={car.price || ''}
                onChange={handleChange}
                className={styles.input}
                min="0"
                step="100"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Image URL</label>
              <input
                type="url"
                name="image_url"
                value={car.image_url || ''}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitBtn}>Update Car</button>
          </div>
          {message && <div style={{ marginTop: 16, color: message.startsWith('Car updated') ? 'green' : 'red' }}>{message}</div>}
        </form>
      </main>
      <Footer />
    </div>
  );
} 