import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { supabase } from '../../utils/supabaseClient';

export default function CarDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyMessage, setBuyMessage] = useState('');

  const fetchCar = async () => {
    if (!id) return;
    setLoading(true);
    // Fetch from Supabase view 'cars_with_seller'
    const { data, error } = await supabase.from('cars_with_seller').select('*').eq('car_id', id).single();
    if (error || !data) {
      setError('Car not found');
      setCar(null);
    } else {
      setCar(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCar();
  }, [id]);

  const handleBuy = async () => {
    setBuyMessage('');
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBuyMessage('❌ Please login to buy this car.');
        return;
      }
      // Insert purchase
      const { error: purchaseError } = await supabase.from('purchases').insert([
        {
          car_id: car.car_id,
          buyer_id: user.id,
          seller_id: car.seller_email ? undefined : null, // fallback if seller_id not available
          amount: car.price
        }
      ]);
      if (purchaseError) {
        setBuyMessage('❌ Purchase failed: ' + purchaseError.message);
        return;
      }
      // Update car status to 'sold'
      const { error: carError, data: carUpdateData } = await supabase
        .from('cars')
        .update({ status: 'sold' })
        .eq('id', car.id);

      console.log('car.id:', car.id);
      console.log('Car update result:', carUpdateData, carError);

      if (carError) {
        setBuyMessage('❌ Error updating car status: ' + carError.message);
        return;
      }
      setBuyMessage('✅ Purchase successful! Redirecting to your dashboard...');
      setTimeout(() => router.push('/buyer-dashboard'), 1500);
    } catch (err) {
      setBuyMessage('❌ Unexpected error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <main style={{ 
          maxWidth: '90%', 
          margin: '0 auto', 
          padding: '2rem 1rem',
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
            <p>Loading car details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div>
        <Navbar />
        <main style={{ 
          maxWidth: '90%', 
          margin: '0 auto', 
          padding: '2rem 1rem',
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
            <h2>Car Not Found</h2>
            <p>The car you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => router.push('/cars')}
              style={{
                padding: '0.8rem 1.5rem',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                marginTop: '1rem'
              }}
            >
              Back to Cars
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Use image_url if available, then fallback
  const imageSrc = (car.image_url && car.image_url.trim() !== '')
    ? car.image_url
    : '/carp2.png';

  return (
    <div>
      <Navbar />
      <main style={{ 
        maxWidth: '90%', 
        margin: '0 auto', 
        padding: '2rem 1rem',
        minHeight: 'calc(100vh - 200px)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            margin: '0 0 1rem 0',
            color: '#333',
            textAlign: 'center'
          }}>
            {car.title}
          </h1>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <img 
              src={imageSrc} 
              alt={car.title} 
              style={{ 
                width: '100%', 
                maxWidth: '500px', 
                height: 'auto', 
                aspectRatio: '16/9', 
                objectFit: 'cover', 
                borderRadius: '12px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                display: 'block' 
              }} 
            />
            <div style={{
              textAlign: 'center',
              maxWidth: '600px'
            }}>
              <p style={{ 
                fontSize: '1.2rem', 
                lineHeight: '1.6',
                color: '#666',
                margin: '0 0 1.5rem 0'
              }}>
                {car.description}
              </p>
              <div style={{
                marginBottom: '1rem',
                color: '#888',
                fontSize: '1rem'
              }}>
                <span>Seller: <b>{car.seller_name || 'Unknown'}</b></span>
                {car.seller_email && <span style={{ marginLeft: 8 }}>({car.seller_email})</span>}
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'center'
              }}>
                <p style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold',
                  color: '#667eea',
                  margin: '0',
                  padding: '1rem',
                  backgroundColor: '#f8f9ff',
                  borderRadius: '8px',
                  border: '2px solid #667eea'
                }}>
                  ${car.price?.toLocaleString()}
                </p>
                <div style={{
                  padding: '0.8rem 1.5rem',
                  backgroundColor: car.status === 'sold' ? '#f44336' : '#4caf50',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  {car.status === 'sold' ? 'SOLD' : 'AVAILABLE'}
                </div>
                {car.status === 'available' && (
                  <button 
                    onClick={handleBuy}
                    style={{
                      padding: '1rem 2rem',
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      marginTop: '1rem'
                    }}
                  >
                    Buy This Car
                  </button>
                )}
                {buyMessage && (
                  <div style={{
                    marginTop: '1rem',
                    color: buyMessage.startsWith('✅') ? 'green' : 'red',
                    fontWeight: 'bold',
                    background: buyMessage.startsWith('✅') ? '#e8f5e8' : '#ffe8e8',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: `1px solid ${buyMessage.startsWith('✅') ? '#4caf50' : '#f44336'}`
                  }}>{buyMessage}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}