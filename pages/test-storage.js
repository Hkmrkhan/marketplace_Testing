import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function TestStorage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [buckets, setBuckets] = useState([]);
  const [testFile, setTestFile] = useState(null);

  const checkStorage = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('🔍 Checking Supabase storage...');
      
      // List all buckets
      const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Error listing buckets:', bucketsError);
        setMessage('❌ Error accessing storage: ' + bucketsError.message);
        return;
      }
      
      console.log('✅ Buckets found:', bucketsData);
      setBuckets(bucketsData);
      
      if (bucketsData.length === 0) {
        setMessage('⚠️ No storage buckets found. Storage might not be enabled.');
        return;
      }
      
      // Check for user-avatars bucket
      const userAvatarsBucket = bucketsData.find(bucket => bucket.id === 'user-avatars');
      
      if (userAvatarsBucket) {
        setMessage(`✅ Storage bucket 'user-avatars' found! Status: ${userAvatarsBucket.public ? 'Public' : 'Private'}`);
        
        // Try to list files in the bucket
        const { data: files, error: filesError } = await supabase.storage
          .from('user-avatars')
          .list('', { limit: 10 });
          
        if (filesError) {
          console.error('❌ Error listing files:', filesError);
          setMessage(prev => prev + `\n⚠️ Warning: Cannot list files (${filesError.message})`);
        } else {
          console.log('✅ Files in bucket:', files);
          setMessage(prev => prev + `\n📁 Files in bucket: ${files.length}`);
        }
        
      } else {
        setMessage('❌ Storage bucket "user-avatars" not found!');
        setMessage(prev => prev + '\n\nAvailable buckets: ' + bucketsData.map(b => b.id).join(', '));
      }
      
    } catch (error) {
      console.error('❌ Storage check error:', error);
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testUpload = async () => {
    if (!testFile) {
      setMessage('❌ Please select a file first');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      console.log('🔄 Testing file upload...');
      
      // Create test file path
      const fileExt = testFile.name.split('.').pop();
      const fileName = `test-${Date.now()}.${fileExt}`;
      const filePath = `test/${fileName}`;
      
      console.log('📁 Uploading to path:', filePath);
      
      // Try to upload
      const { data, error } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, testFile, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error('❌ Upload error:', error);
        setMessage('❌ Upload failed: ' + error.message);
        return;
      }
      
      console.log('✅ Upload successful:', data);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);
        
      console.log('🔗 Public URL:', publicUrl);
      
      setMessage(`✅ Test upload successful!\n\nFile: ${fileName}\nPath: ${filePath}\nURL: ${publicUrl}`);
      
    } catch (error) {
      console.error('❌ Test upload error:', error);
      setMessage('❌ Test upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937' }}>
          🗄️ Supabase Storage Test
        </h1>
        
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginTop: 0, color: '#374151' }}>Storage Status Check</h2>
          
          <button
            onClick={checkStorage}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: '1rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loading ? 'Checking...' : '🔍 Check Storage Status'}
          </button>
          
          {message && (
            <div style={{ 
              padding: '1rem', 
              borderRadius: '8px',
              background: message.includes('✅') ? '#f0f9ff' : message.includes('❌') ? '#fef2f2' : '#fef3c7',
              border: message.includes('✅') ? '1px solid #0ea5e9' : message.includes('❌') ? '1px solid #ef4444' : '1px solid #f59e0b',
              color: message.includes('✅') ? '#0c4a6e' : message.includes('❌') ? '#7f1d1d' : '#92400e',
              whiteSpace: 'pre-line',
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}>
              {message}
            </div>
          )}
          
          {buckets.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ color: '#374151' }}>Available Storage Buckets:</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {buckets.map(bucket => (
                  <div key={bucket.id} style={{
                    padding: '0.5rem',
                    background: '#f9fafb',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span><strong>{bucket.id}</strong></span>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      background: bucket.public ? '#dcfce7' : '#fef3c7',
                      color: bucket.public ? '#166534' : '#92400e'
                    }}>
                      {bucket.public ? 'Public' : 'Private'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ marginTop: 0, color: '#374151' }}>Test File Upload</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setTestFile(e.target.files[0])}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                width: '100%'
              }}
            />
          </div>
          
          <button
            onClick={testUpload}
            disabled={!testFile || loading}
            style={{
              background: testFile && !loading ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              cursor: testFile && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              if (testFile && !loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loading ? 'Uploading...' : '📤 Test Upload'}
          </button>
          
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
            This will test if you can upload files to the user-avatars bucket. 
            Select a small image file to test.
          </p>
        </div>
        
        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          background: '#f0f9ff', 
          borderRadius: '8px',
          border: '1px solid #0ea5e9'
        }}>
          <h3 style={{ marginTop: 0, color: '#0369a1' }}>What This Test Does:</h3>
          <ol style={{ color: '#0c4a6e', lineHeight: '1.6' }}>
            <li><strong>Storage Status Check</strong> - Verifies if storage buckets exist and are accessible</li>
            <li><strong>Bucket Discovery</strong> - Lists all available storage buckets</li>
            <li><strong>File Upload Test</strong> - Tests if you can actually upload files to the user-avatars bucket</li>
            <li><strong>Permission Check</strong> - Verifies RLS policies and user permissions</li>
          </ol>
          
          <p style={{ color: '#0c4a6e', marginTop: '1rem' }}>
            <strong>If tests fail:</strong> You need to run the SQL script in Supabase to set up storage properly.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

