import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import StripeCheckout from '../../components/StripeCheckout';
import Reviews from '../../components/Reviews';
import { supabase } from '../../utils/supabaseClient';



export default function CarDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyMessage, setBuyMessage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [buyerId, setBuyerId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchCar = async () => {
    if (!id) return;
    setLoading(true);
    
    // Direct query to cars table with seller info to get video_url
    const { data, error } = await supabase
      .from('cars')
      .select(`
        *,
        profiles!inner(
          full_name,
          email,
          whatsapp_number
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.log('Car fetch error:', error);
      setError('Car not found');
      setLoading(false);
      return;
    }
    
    if (!data) {
      setError('Car not found');
      setLoading(false);
      return;
    }
    
    // Add seller info to match the expected format
    const carData = {
      ...data,
      seller_name: data.profiles?.full_name,
      seller_email: data.profiles?.email,
      seller_whatsapp: data.profiles?.whatsapp_number
    };
    
    console.log('=== CAR DATA DEBUG ===');
    console.log('Complete car object:', carData);
    console.log('Video URL:', carData.video_url);
    console.log('=== END CAR DATA DEBUG ===');
    
    setCar(carData);
    setLoading(false);
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    console.log('=== PAYMENT SUCCESS HANDLER CALLED ===');
    console.log('Payment Intent:', paymentIntent);
    console.log('Car object:', car);
    console.log('Buyer ID:', buyerId);
    
    setPaymentSuccess(true);
    setShowPaymentModal(false);
    
    // Show success message
    setBuyMessage('✅ Payment successful! Car purchased successfully. Updating car status...');
    
    // Refresh car data after a delay to show updated status
    setTimeout(() => {
      console.log('Refreshing car data...');
      fetchCar();
      setBuyMessage('✅ Car purchased successfully! Car status updated to sold.');
      console.log('=== PAYMENT SUCCESS HANDLER COMPLETED ===');
    }, 2000);
  };

  useEffect(() => {
    fetchCar();
  }, [id]);

  useEffect(() => {
    const fetchBuyer = async () => {
      try {
        setUserLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setBuyerId(user.id);
          // Also fetch user profile to get user_type
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', user.id)
            .single();
          setCurrentUser(profile);
        } else {
          setBuyerId(null);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setBuyerId(null);
        setCurrentUser(null);
      } finally {
        setUserLoading(false);
      }
    };
    fetchBuyer();
  }, []);



  const handleBuy = () => {
    if (!buyerId) {
      setBuyMessage('❌ Please login to purchase this car');
      return;
    }
    
    if (car.status === 'sold') {
      setBuyMessage('❌ This car is already sold');
      return;
    }
    
    // Log car data for debugging
    console.log('=== CAR DATA DEBUG ===');
    console.log('Complete car object:', car);
    console.log('Car ID:', car.id);
    console.log('Car ID (alternative):', car.car_id);
    console.log('Buyer ID:', buyerId);
    console.log('Seller ID (seller_id):', car.seller_id);
    console.log('Seller ID (profiles.id):', car.profiles?.id);
    console.log('Seller ID (user_id):', car.user_id);
    console.log('Car price:', car.price);
    console.log('Car status:', car.status);
    console.log('=== END DEBUG ===');
    
    // Show payment modal
    setShowPaymentModal(true);
    setBuyMessage('');
  };

  // Handle purchase after successful payment (same as buyer dashboard)
  const handlePurchase = async (car) => {
    try {
      console.log('carToPurchase:', car);
      console.log('seller_id being sent:', car?.seller_id);
      if (!car) {
        alert('Car not found!');
        return;
      }
      
      // Insert purchase record with all required fields
      const purchaseData = {
        car_id: car.id,
        buyer_id: buyerId,
        seller_id: car.seller_id, // Always use car.seller_id
        amount: car.price,
        purchase_date: new Date().toISOString()
      };
      
      const { data: purchaseResult, error: purchaseError } = await supabase
        .from('purchases')
        .insert([purchaseData])
        .select();
        
      if (purchaseError) {
        console.error('Purchase error:', purchaseError);
        alert('Error making purchase: ' + purchaseError.message);
        return;
      }
      
      // Update car status to sold
      const { data: updateResult, error: carError } = await supabase
        .from('cars')
        .update({ status: 'sold' })
        .eq('id', car.id)
        .select();
        
      if (carError) {
        console.error('Car update error:', carError);
        alert('Warning: Purchase successful but car status update failed.');
      }
      
      alert('✅ Car purchased successfully!');
      setBuyMessage('✅ Car purchased successfully! Car status updated to sold.');
      
      // Refresh car data to show updated status
      setTimeout(() => {
        fetchCar();
      }, 1000);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error making purchase: ' + error.message);
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
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Header Section */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '3rem',
            paddingBottom: '2rem',
            borderBottom: '2px solid #f1f5f9'
        }}>
          <h1 style={{ 
              fontSize: '2.8rem', 
              fontWeight: '800', 
              color: '#0f172a', 
            margin: '0 0 1rem 0',
              background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
          }}>
            {car.title}
          </h1>
          
            {/* Price and Status Badge */}
          <div style={{
            display: 'flex',
              justifyContent: 'center', 
            alignItems: 'center',
              gap: '2rem', 
              marginBottom: '1.5rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '1.2rem 2.5rem',
                borderRadius: '50px',
                fontSize: '1.8rem',
                fontWeight: '700',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                border: '2px solid #dbeafe'
              }}>
                ${car.price?.toLocaleString()}
              </div>
              
              <div style={{ 
                background: car.status === 'available' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                padding: '0.8rem 1.8rem',
                borderRadius: '25px',
                fontSize: '1.1rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: car.status === 'available' ? '0 4px 15px rgba(16, 185, 129, 0.3)' : '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}>
                {car.status === 'available' ? '🟢 Available' : '🔴 Sold'}
              </div>
            </div>
          </div>

          {/* Car Images Gallery */}
          <div style={{ 
            display: 'flex', 
            gap: '2rem', 
            marginBottom: '3rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            alignItems: 'flex-start'
          }}>
            {/* Main Image */}
            <div style={{
              width: '500px', 
              height: '375px', 
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              border: '3px solid #f8fafc',
              position: 'relative'
          }}>
            <img 
                src={currentImage} 
              alt={car.title} 
              style={{ 
                width: '100%', 
                  height: '100%', 
                objectFit: 'cover', 
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              />
              {/* Image Counter */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>
            
            {/* Thumbnails Grid */}
            {images.length > 1 && (
              <div style={{
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.8rem',
                maxHeight: '375px',
                overflowY: 'auto',
                padding: '0.5rem'
              }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                  <img
                    src={img}
                      alt={`${car.title} ${idx + 1}`}
                      onClick={() => setCurrentImageIndex(idx)}
                    style={{
                        width: '120px', 
                        height: '90px', 
                      objectFit: 'cover',
                        borderRadius: '12px',
                      cursor: 'pointer',
                        border: currentImageIndex === idx ? '3px solid #3b82f6' : '2px solid #e2e8f0',
                        transition: 'all 0.2s ease',
                        opacity: currentImageIndex === idx ? '1' : '0.8'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.opacity = '1';
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (currentImageIndex !== idx) {
                          e.target.style.opacity = '0.8';
                        }
                        e.target.style.transform = 'scale(1)';
                      }}
                    />
                    {currentImageIndex === idx && (
                      <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#3b82f6',
                        color: 'white',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Car Video Section */}
          {car.video_url && (
            <div style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
              padding: '2rem', 
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              marginBottom: '2.5rem'
            }}>
              <h2 style={{ 
                margin: '0 0 1.5rem 0', 
                color: '#1e293b', 
                fontSize: '1.8rem', 
                fontWeight: '700',
                textAlign: 'center'
              }}>
                🎥 Car Video
              </h2>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <video
                  src={car.video_url}
                  controls
                  width="100%"
                  height="400"
                  style={{
                    maxWidth: '800px',
                    borderRadius: '12px',
                    border: 'none'
                  }}
                  title="Car Video"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}

          {/* Car Information - EXACT SAME LOGIC AS CARSCARD */}
          <div style={{ 
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
            padding: '2rem', 
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            marginBottom: '2.5rem'
          }}>
            <h2 style={{ 
              margin: '0 0 1.5rem 0', 
              color: '#1e293b', 
              fontSize: '1.8rem', 
              fontWeight: '700',
              textAlign: 'center'
            }}>
              🚗 Car Details
            </h2>

            <div style={{
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '1.5rem'
            }}>
              {/* Basic Info */}
              <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.3rem', fontWeight: '600' }}>Basic Information</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#64748b' }}>Car Name:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>{car.title}</p>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#64748b' }}>Price:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>${car.price}</p>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#64748b' }}>Status:</strong>
              <p style={{ 
                    margin: '0.5rem 0 0 0', 
                    fontSize: '1.1rem', 
                    fontWeight: '600', 
                    color: car.status === 'sold' ? '#dc2626' : '#059669'
                  }}>
                    {car.status === 'sold' ? 'Sold' : 'Available'}
                  </p>
                </div>
              </div>

              {/* Additional Details */}
              <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.3rem', fontWeight: '600' }}>Additional Details</h3>
                {car.year && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#64748b' }}>Year:</strong>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>📅 {car.year}</p>
                  </div>
                )}
                {car.miles && car.miles > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#64748b' }}>Miles:</strong>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>Miles: {car.miles.toLocaleString()}</p>
                  </div>
                )}
                {car.reg_district && car.reg_district !== 'Other' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#64748b' }}>Location:</strong>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>📍 {car.reg_district}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.3rem', fontWeight: '600' }}>Description</h3>
                <p style={{ margin: '0', lineHeight: '1.6', color: '#0f172a' }}>{car.description}</p>
              </div>

              {/* Seller Info */}
              <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.3rem', fontWeight: '600' }}>Seller Information</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#64748b' }}>Seller:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>{car.seller_name}</p>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#64748b' }}>Email:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>{car.seller_email}</p>
                </div>
              </div>
            </div>
          </div>





          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1.5rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
                {car.status === 'available' && currentUser?.user_type === 'buyer' && (
                  <button 
                    onClick={handleBuy}
                    style={{
                  padding: '1.2rem 2.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      border: 'none',
                  borderRadius: '50px',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                  fontWeight: '600',
                  boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  border: '2px solid #dbeafe'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                }}
              >
                🚗 Buy This Car
                  </button>
                )}
            
                {buyMessage && (
                  <div style={{
                width: '100%',
                textAlign: 'center',
                color: buyMessage.startsWith('✅') ? '#059669' : '#dc2626',
                fontWeight: '600',
                background: buyMessage.startsWith('✅') ? '#ecfdf5' : '#fef2f2',
                    padding: '1rem',
                borderRadius: '12px',
                border: buyMessage.startsWith('✅') ? '2px solid #10b981' : '2px solid #ef4444',
                fontSize: '1.1rem'
              }}>
                {buyMessage}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Reviews Section */}
      {userLoading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          background: '#f8fafc',
          borderRadius: '8px',
          margin: '2rem 0'
        }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <p>Loading user data...</p>
        </div>
      ) : (
        <>
          {console.log('🔍 Debug: Rendering Reviews component with props:', {
            carId: car.id || car.car_id,
            currentUserId: buyerId,
            currentUserType: currentUser?.user_type,
            carSellerId: car.seller_id,
            userLoading,
            car: car
          })}
          <Reviews 
            carId={car.id || car.car_id} 
            currentUserId={buyerId} 
            currentUserType={currentUser?.user_type} 
            carSellerId={car.seller_id} 
          />
        </>
      )}

      {/* Discuss This Car Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: '2rem',
        marginBottom: '1rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={() => router.push(`/forum/create?car_id=${car.id}&car_title=${encodeURIComponent(car.title)}`)}
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          💬 Discuss This Car in Forum
        </button>
        
        <button 
          onClick={() => router.push('/cars')}
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          ← Back to Cars
        </button>
      </div>


      
      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0, color: '#333' }}>Complete Purchase</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{car.title}</h3>
              <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
                Price: <strong style={{ color: '#667eea', fontSize: '1.2rem' }}>${car.price?.toLocaleString()}</strong>
              </p>
            </div>
            
            <StripeCheckout 
              car={car} 
              userId={buyerId} 
              onSuccess={async (paymentIntent) => {
                await handlePurchase(car); // Insert purchase from frontend (same as buyer dashboard)
                setShowPaymentModal(false);
                alert('Payment successful! Car marked as sold.');
              }}
            />
          </div>
        </div>
      )}
      
      <Footer />
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}