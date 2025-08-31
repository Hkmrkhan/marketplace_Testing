import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import ProfilePictureUploader from '../components/ProfilePictureUploader';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ProfileExample() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAndProfile();
  }, []);

  const fetchUserAndProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpdate = (newAvatarUrl) => {
    setProfile(prev => ({
      ...prev,
      avatar_url: newAvatarUrl
    }));
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <main style={{ padding: '2rem', textAlign: 'center' }}>
          <div>Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Navbar />
        <main style={{ padding: '2rem', textAlign: 'center' }}>
          <div>Please login to view your profile</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937' }}>
          Profile Picture Uploader
        </h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Profile Picture Uploader */}
          <div>
            <h2 style={{ marginBottom: '1rem', color: '#374151' }}>Upload Profile Picture</h2>
            <ProfilePictureUploader
              currentAvatarUrl={profile?.avatar_url}
              onAvatarUpdate={handleAvatarUpdate}
              userId={user.id}
            />
          </div>

          {/* Profile Information */}
          <div>
            <h2 style={{ marginBottom: '1rem', color: '#374151' }}>Profile Information</h2>
            <div style={{ 
              background: 'white', 
              padding: '1.5rem', 
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong>User ID:</strong> {user.id}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Email:</strong> {user.email}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Full Name:</strong> {profile?.full_name || 'Not set'}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>User Type:</strong> {profile?.user_type || 'Not set'}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Avatar URL:</strong> {profile?.avatar_url || 'No avatar uploaded'}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          background: '#f0f9ff', 
          borderRadius: '8px',
          border: '1px solid #0ea5e9'
        }}>
          <h3 style={{ marginTop: 0, color: '#0369a1' }}>How to Use:</h3>
          <ol style={{ color: '#0c4a6e', lineHeight: '1.6' }}>
            <li>First run the SQL script in <code>database/add_avatar_functionality.sql</code> in Supabase</li>
            <li>Click or drag an image to the upload area</li>
            <li>Supported formats: PNG, JPG, JPEG, GIF (max 5MB)</li>
            <li>Your profile picture will be automatically updated</li>
            <li>Use the "Remove Picture" button to delete your avatar</li>
          </ol>
        </div>
      </main>
      <Footer />
    </div>
  );
}

