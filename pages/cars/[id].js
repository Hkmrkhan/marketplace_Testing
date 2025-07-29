import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { supabase } from '../../utils/supabaseClient';

function ChatModal({ open, onClose, carId, sellerId, buyerId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages_with_names')
        .select('*')
        .eq('car_id', carId)
        .or(`and(sender_id.eq.${buyerId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${buyerId})`)
        .order('created_at', { ascending: true });
      if (!error) setMessages(data || []);
    };
    fetchMessages();
  }, [open, carId, buyerId, sellerId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('messages').insert([
      {
        car_id: carId,
        sender_id: buyerId,
        receiver_id: sellerId,
        message: newMessage.trim(),
      },
    ]);
    if (!error) {
      setMessages([...messages, {
        car_id: carId,
        sender_id: buyerId,
        receiver_id: sellerId,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
      }]);
      setNewMessage('');
    }
    setLoading(false);
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 8, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
        <h3 style={{ marginTop: 0 }}>Chat with Seller</h3>
        <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12, border: '1px solid #eee', borderRadius: 4, padding: 8 }}>
          {messages.length === 0 ? <div style={{ color: '#888' }}>No messages yet.</div> : messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: 8, textAlign: msg.sender_id === buyerId ? 'right' : 'left' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                {msg.sender_name || (msg.sender_id === buyerId ? 'You' : 'Seller')}
              </div>
              <span style={{ background: msg.sender_id === buyerId ? '#e0e7ff' : '#f3f3f3', padding: '6px 12px', borderRadius: 12, display: 'inline-block' }}>{msg.message}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !newMessage.trim()} style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Send</button>
        </div>
        <button onClick={onClose} style={{ marginTop: 16, background: 'none', border: 'none', color: '#667eea', cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  );
}

export default function CarDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyMessage, setBuyMessage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [buyerId, setBuyerId] = useState(null);
  const [sellerWhatsapp, setSellerWhatsapp] = useState(null);

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

  useEffect(() => {
    const fetchBuyer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setBuyerId(user.id);
      else setBuyerId(null);
    };
    fetchBuyer();
  }, []);

  useEffect(() => {
    if (car && car.seller_id) {
      // Try to get whatsapp_number from car or seller profile
      const fetchWhatsapp = async () => {
        let whatsapp = car.seller_whatsapp_number;
        if (!whatsapp) {
          const { data: profile } = await supabase.from('profiles').select('whatsapp_number').eq('id', car.seller_id).single();
          whatsapp = profile?.whatsapp_number || null;
        }
        setSellerWhatsapp(whatsapp);
      };
      fetchWhatsapp();
    }
  }, [car]);

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

  // Combine all images for the car
  const getAllImages = () => {
    const images = [];
    if (car?.image_url && car.image_url.trim() !== '') {
      images.push(car.image_url);
    }
    if (car?.additional_images && Array.isArray(car.additional_images)) {
      images.push(...car.additional_images.filter(img => img && img.trim() !== ''));
    }
    return images.length > 0 ? images : ['/carp2.png'];
  };

  const images = getAllImages();
  const currentImage = images[currentImageIndex];

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
            {/* Main Image */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <img 
                src={currentImage} 
              alt={car.title} 
              style={{ 
                width: '100%', 
                height: 'auto', 
                aspectRatio: '16/9', 
                objectFit: 'cover', 
                display: 'block' 
              }} 
            />
            </div>
            {/* Thumbnails Row */}
            {images.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '8px',
                margin: '10px 0 0 0',
                padding: '0 8px',
                justifyContent: 'flex-start',
                alignItems: 'center',
                overflowX: 'auto',
                scrollbarWidth: 'thin',
                width: '100%',
                maxWidth: '500px'
              }}>
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: 'cover',
                      borderRadius: 6,
                      border: idx === currentImageIndex ? '2px solid #667eea' : '2px solid transparent',
                      cursor: 'pointer',
                      boxShadow: idx === currentImageIndex ? '0 2px 8px rgba(102,126,234,0.15)' : '0 1px 4px rgba(0,0,0,0.08)',
                      background: '#fff',
                      transition: 'border 0.2s, box-shadow 0.2s',
                      marginRight: 0
                    }}
                    onClick={() => setCurrentImageIndex(idx)}
                  />
                ))}
              </div>
            )}

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
                  {car.status === 'sold' ? 'Sold' : 'Available'}
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
      {/* Chat and WhatsApp buttons for buyers only, if car is available */}
      {car.status === 'available' && buyerId && car.seller_id && (
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button onClick={() => setShowChat(true)} style={{ padding: '0.7rem 1.5rem', background: '#e0e7ff', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Chat with Seller
          </button>
          {sellerWhatsapp && (
            <a href={`https://wa.me/${sellerWhatsapp.replace(/[^0-9]/g, '')}?text=Hi, I am interested in your car (${car.title})`} target="_blank" rel="noopener noreferrer" style={{ padding: '0.7rem 1.5rem', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'none' }}>
              Contact on WhatsApp
            </a>
          )}
        </div>
      )}
      <ChatModal open={showChat} onClose={() => setShowChat(false)} carId={car.car_id || car.id} sellerId={car.seller_id} buyerId={buyerId} />
      <Footer />
    </div>
  );
}