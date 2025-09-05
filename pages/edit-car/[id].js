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
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');

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
      // Allow if current user is the seller/owner OR if user is admin
      if (carData.user_id !== user.id && profile?.user_type !== 'admin') {
        setCar(null);
        setLoading(false);
        setMessage('You are not authorized to edit this car.');
        return;
      }
      
      // Debug log for admin access
      if (profile?.user_type === 'admin') {
        console.log('🔓 Admin access granted for car:', carData.id);
      } else {
        console.log('🔓 Seller access granted for car:', carData.id);
      }
      console.log('Fetched car data:', carData); // Debug log
      setCar(carData);
      setLoading(false);
    };
    if (id) fetchUserAndCar();
  }, [id, router]);

  const handleChange = (e) => {
    setCar({ ...car, [e.target.name]: e.target.value });
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file (MP4, AVI, MOV, etc.)');
        return;
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('Video file size must be less than 50MB');
        return;
      }
      
      setVideoFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!car) {
      setMessage('Car not found.');
      return;
    }
    
    try {
      let videoUrl = car.video_url;
      
      // Upload new video file if provided
      if (videoFile) {
        setMessage('📹 Uploading new video...');
        
        // Create unique filename
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `video-${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `videos/${user.id}/${fileName}`;

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('car_videos')
          .upload(filePath, videoFile);

        if (uploadError) {
          console.error('Video upload error:', uploadError);
          setMessage('❌ Error uploading video: ' + uploadError.message);
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('car_videos')
          .getPublicUrl(filePath);
        
        videoUrl = urlData.publicUrl;
        console.log('Video uploaded successfully:', videoUrl);
      }

      // Update car in Supabase with all fields
      const { error } = await supabase.from('cars').update({
        title: car.title,
        description: car.description,
        price: parseFloat(car.price),
        miles: car.miles ? parseInt(car.miles) : 0,
        reg_district: car.reg_district || 'Other',
        year: car.year ? parseInt(car.year) : 2020,
        image_url: car.image_url,
        additional_images: car.additional_images?.filter(img => img && img.trim() !== '') || [],
        video_url: videoUrl
      }).eq('id', car.id);
      
      if (error) {
        setMessage('Failed to update car: ' + error.message);
        return;
      }
      
      setMessage('Car updated successfully!');
      // Redirect based on user type
      if (userProfile?.user_type === 'admin') {
        setTimeout(() => router.push('/admin-dashboard'), 1500);
      } else {
        setTimeout(() => router.push('/seller-dashboard'), 1500);
      }
    } catch (error) {
      console.error('Error updating car:', error);
      setMessage('An unexpected error occurred: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!car) return <div>{message || 'Car not found.'}</div>;
  
  console.log('Current car state in render:', car); // Debug log
  console.log('🔍 Edit Page Debug:', {
    userType: userProfile?.user_type,
    carSellerId: car?.user_id,
    currentUserId: userProfile?.id,
    isAdmin: userProfile?.user_type === 'admin',
    canEdit: userProfile?.user_type === 'admin' || car?.user_id === userProfile?.id
  });

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
            <label className={styles.label}>Car Title <span className={styles.required}>*</span></label>
            <input
              type="text"
              name="title"
              placeholder="e.g., Toyota Corolla 2020"
              value={car.title || ''}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Description <span className={styles.required}>*</span></label>
            <textarea
              name="description"
              placeholder="Describe your car's features, condition, and any special details..."
              value={car.description || ''}
              onChange={handleChange}
              className={styles.textarea}
              rows="4"
              required
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Price ($) <span className={styles.required}>*</span></label>
              <input
                type="number"
                name="price"
                placeholder="15000"
                value={car.price || ''}
                onChange={handleChange}
                className={styles.input}
                min="0"
                step="100"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Miles</label>
              <input
                type="number"
                name="miles"
                placeholder="50000"
                value={car.miles || ''}
                onChange={handleChange}
                className={styles.input}
                min="0"
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Registration City</label>
              <select
                name="reg_district"
                value={car.reg_district || ''}
                onChange={handleChange}
                className={styles.input}
              >
                <option value="">Select City</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
                <option value="Peshawar">Peshawar</option>
                <option value="Quetta">Quetta</option>
                <option value="Faisalabad">Faisalabad</option>
                <option value="Multan">Multan</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Year</label>
              <input
                type="number"
                name="year"
                placeholder="2020"
                value={car.year || ''}
                onChange={handleChange}
                className={styles.input}
                min="1900"
                max="2025"
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Car Video (Optional)</label>
            <p className={styles.helperText}>Upload a new video file to replace existing video (MP4, AVI, MOV - Max 50MB)</p>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className={styles.input}
            />
            {car.video_url && !videoPreview && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  Current Video:
                </p>
                <video
                  src={car.video_url}
                  controls
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '200px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            {videoPreview && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  New Video Preview:
                </p>
                <video
                  src={videoPreview}
                  controls
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '200px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                />
              </div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Primary Image URL <span className={styles.required}>*</span></label>
            <input
              type="url"
              name="image_url"
              placeholder="https://example.com/car-image.jpg"
              value={car.image_url || ''}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Additional Images (Optional)</label>
            <div className={styles.imageInputs}>
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  type="url"
                  name={`additional_image_${index}`}
                  placeholder={`Additional image ${index + 1} URL`}
                  value={car.additional_images?.[index] || ''}
                  onChange={(e) => {
                    const newAdditionalImages = [...(car.additional_images || [])];
                    newAdditionalImages[index] = e.target.value;
                    setCar({ ...car, additional_images: newAdditionalImages });
                  }}
                  className={styles.input}
                />
              ))}
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitBtn}>Update Car</button>
            <button type="button" className={styles.cancelBtn} onClick={() => router.push('/seller-dashboard')}>Cancel</button>
          </div>
          
          {message && <div style={{ marginTop: 16, color: message.startsWith('Car updated') ? 'green' : 'red' }}>{message}</div>}
        </form>
      </main>
      <Footer />
    </div>
  );
} 