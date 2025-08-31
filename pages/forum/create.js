import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import styles from '../../styles/Forum.module.css';

export default function CreateDiscussion() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cars, setCars] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    car_id: ''
  });
  const router = useRouter();
  
  // Check for pre-filled car info from URL
  useEffect(() => {
    const { car_id, car_title } = router.query;
    if (car_id && car_title) {
      setFormData(prev => ({
        ...prev,
        car_id: car_id,
        title: `Discussion about ${car_title}`
      }));
    }
  }, [router.query]);

  useEffect(() => {
    fetchUser();
    fetchCars();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setUser(user);
    setLoading(false);
  };

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id, title, price, image_url')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCars(data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.car_id) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      console.log('🚀 Creating discussion with data:', {
        car_id: formData.car_id,
        user_id: user.id,
        title: formData.title.trim(),
        content: formData.content.trim()
      });

      const { data, error } = await supabase
        .from('car_discussions')
        .insert({
          car_id: formData.car_id,
          user_id: user.id,
          title: formData.title.trim(),
          content: formData.content.trim()
        })
        .select()
        .single();

      console.log('🔍 Supabase response:', { data, error });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      if (data && data.id) {
        console.log('✅ Discussion created successfully with ID:', data.id);
        console.log('🔄 Redirecting to forum home page');
        
        // Show success message and redirect to forum home
        alert('✅ Discussion created successfully! Redirecting to forum...');
        router.push('/forum');
      } else {
        console.error('❌ No data returned from discussion creation');
        alert('Discussion created but could not redirect. Please check the forum.');
      }
    } catch (error) {
      console.error('❌ Error creating discussion:', error);
      alert('Error creating discussion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    router.push('/forum');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.createDiscussionContainer}>
      {/* Back Button */}
      <button onClick={goBack} className={styles.backBtn}>
        ← Back to Forum
      </button>

      <div className={styles.createDiscussionContent}>
        <h1>Start a New Discussion</h1>
        <p>Share your thoughts, ask questions, or discuss cars with the community</p>

        <form onSubmit={handleSubmit} className={styles.createDiscussionForm}>
          {/* Car Selection */}
          <div className={styles.formGroup}>
            <label htmlFor="car_id">Select Car to Discuss:</label>
            <select
              id="car_id"
              name="car_id"
              value={formData.car_id}
              onChange={handleInputChange}
              required
              className={styles.carSelect}
            >
              <option value="">Choose a car...</option>
              {cars.map(car => (
                <option key={car.id} value={car.id}>
                  {car.title} - ${car.price}
                </option>
              ))}
            </select>
          </div>

          {/* Discussion Title */}
          <div className={styles.formGroup}>
            <label htmlFor="title">Discussion Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Is this car good for family use?"
              required
              className={styles.titleInput}
              maxLength={200}
            />
            <small>{formData.title.length}/200 characters</small>
          </div>

          {/* Discussion Content */}
          <div className={styles.formGroup}>
            <label htmlFor="content">Discussion Content:</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Share your thoughts, ask questions, or provide details..."
              required
              className={styles.contentTextarea}
              rows={8}
            />
          </div>

          {/* Submit Button */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={goBack}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Discussion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
