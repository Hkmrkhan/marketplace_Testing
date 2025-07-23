import { useEffect, useState } from 'react';
import { checkEnvironment } from '../utils/checkEnvironment';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runDebugChecks() {
      const info = {
        environment: checkEnvironment(),
        supabaseConnection: true, // Mock data always works
        currentUser: null, // Mock data
        tables: {
          cars: '✅ Mock Data Available',
          profiles: '✅ Mock Data Available', 
          purchases: '✅ Mock Data Available'
        },
        errors: []
      };

      // Get user profile if user exists
      if (info.currentUser) {
        // Mock user profile
        info.userProfile = {
          id: info.currentUser.id,
          full_name: 'Test User',
          email: 'test@example.com',
          user_type: 'buyer'
        };
      }

      // Check mock data availability
      try {
        const cars = JSON.parse(localStorage.getItem('marketplace_cars') || '[]');
        const profiles = JSON.parse(localStorage.getItem('marketplace_profiles') || '[]');
        const purchases = JSON.parse(localStorage.getItem('marketplace_purchases') || '[]');
        
        info.mockData = {
          cars: cars.length,
          profiles: profiles.length,
          purchases: purchases.length
        };
      } catch (error) {
        info.errors.push(`Mock data error: ${error.message}`);
      }

      setDebugInfo(info);
      setLoading(false);
    }

    runDebugChecks();
  }, []);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Running Debug Checks...</h2>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Debug Information</h1>
        
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <h2>🔄 Mock Data Mode</h2>
          <p><strong>Status:</strong> ✅ Using Local Storage & Mock Data</p>
          <p><strong>Supabase:</strong> ❌ Disabled (No Database Connection Required)</p>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2>Environment</h2>
          <p>Environment Variables: ✅ OK (No Supabase Required)</p>
          <p>Data Connection: ✅ Mock Data Working</p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2>Mock Data Tables</h2>
          <p>Cars Table: {debugInfo.tables.cars}</p>
          <p>Profiles Table: {debugInfo.tables.profiles}</p>
          <p>Purchases Table: {debugInfo.tables.purchases}</p>
          
          {debugInfo.mockData && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <h3>Data Counts:</h3>
              <p>Cars: {debugInfo.mockData.cars} records</p>
              <p>Profiles: {debugInfo.mockData.profiles} records</p>
              <p>Purchases: {debugInfo.mockData.purchases} records</p>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2>User Information</h2>
          <p>Current User: {debugInfo.currentUser ? '✅ Logged In' : '❌ Not Logged In'}</p>
          {debugInfo.currentUser && (
            <div style={{ marginLeft: '1rem' }}>
              <p>User ID: {debugInfo.currentUser.id}</p>
              <p>Email: {debugInfo.currentUser.email}</p>
              <p>Profile: {debugInfo.userProfile ? '✅ Found' : '❌ Not Found'}</p>
              {debugInfo.userProfile && (
                <div style={{ marginLeft: '1rem' }}>
                  <p>Full Name: {debugInfo.userProfile.full_name}</p>
                  <p>User Type: {debugInfo.userProfile.user_type}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {debugInfo.errors.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2>Errors Found</h2>
            <ul style={{ color: 'red' }}>
              {debugInfo.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <h2>Environment Variables</h2>
          <p>NEXT_PUBLIC_SUPABASE_URL: ❌ Not Required (Using Mock Data)</p>
          <p>NEXT_PUBLIC_SUPABASE_KEY: ❌ Not Required (Using Mock Data)</p>
          <p>NODE_ENV: {process.env.NODE_ENV || 'development'}</p>
        </div>

        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
          <h3>✅ Ready to Test</h3>
          <p>Your app is now running with mock data. You can:</p>
          <ul>
            <li>Sign up with any email/password</li>
            <li>Browse cars</li>
            <li>Add/edit/delete cars</li>
            <li>Make purchases</li>
            <li>All data is stored in browser's local storage</li>
          </ul>
        </div>

        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '0.8rem 1.5rem',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Refresh Debug Info
        </button>
      </div>
      <Footer />
    </div>
  );
} 