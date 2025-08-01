import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIChat from '../components/AIChat';
import { supabase } from '../utils/supabaseClient';
import styles from '../styles/Dashboard.module.css';

// WhatsApp number formatting function
const formatWhatsAppNumber = (number) => {
  if (!number) return null;
  
  // Remove non-digit characters
  let cleaned = number.replace(/\D/g, '');
  
  // Convert 03XX... to 92XX... (Pakistan format)
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  }
  
  // If already starts with 92, return as is
  if (cleaned.startsWith('92')) {
    return cleaned;
  }
  
  // If it's a 10-digit number, assume it's Pakistan and add 92
  if (cleaned.length === 10) {
    return '92' + cleaned;
  }
  
  return cleaned;
};

// Unified Chat Component for Seller
function UnifiedSellerChat({ sellerId, myCars, buyersByCar }) {
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Get all unique buyers across all cars
  const allBuyers = useMemo(() => {
    const buyers = [];
    Object.keys(buyersByCar).forEach(carId => {
      const car = myCars.find(c => c.id === carId);
      buyersByCar[carId].forEach(buyer => {
        buyers.push({
          ...buyer,
          carId,
          carTitle: car?.title || 'Unknown Car'
        });
      });
    });
    return buyers;
  }, [buyersByCar, myCars]);

  const fetchMessages = async () => {
    if (!selectedCar || !selectedBuyer) return;
    
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages_with_names')
        .select('*')
        .eq('car_id', selectedCar)
        .or(`and(sender_id.eq.${selectedBuyer},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${selectedBuyer})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || loading || !selectedCar || !selectedBuyer) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('messages')
        .insert([{
          car_id: selectedCar,
          sender_id: sellerId,
          receiver_id: selectedBuyer,
          message: newMessage.trim()
        }]);

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCar && selectedBuyer) {
      fetchMessages();
    }
  }, [selectedCar, selectedBuyer]);

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length]);

  // Auto-select first buyer if available
  useEffect(() => {
    if (allBuyers.length > 0 && !selectedBuyer) {
      const firstBuyer = allBuyers[0];
      setSelectedCar(firstBuyer.carId);
      setSelectedBuyer(firstBuyer.id);
    }
  }, [allBuyers, selectedBuyer]);

  if (allBuyers.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#666',
        background: '#f8f9fa',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <p>No buyers have messaged you yet.</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>When buyers contact you, their messages will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      margin: '20px 0',
      overflow: 'hidden'
    }}>
      {/* Header with buyer selection */}
      <div style={{
        background: '#667eea',
        color: 'white',
        padding: '16px 20px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>💬 Chat with Buyers</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={selectedBuyer || ''}
            onChange={(e) => {
              const buyer = allBuyers.find(b => b.id === e.target.value);
              if (buyer) {
                setSelectedCar(buyer.carId);
                setSelectedBuyer(buyer.id);
              }
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            {allBuyers.map(buyer => (
              <option key={buyer.id} value={buyer.id}>
                {buyer.full_name || 'Unknown'} - {buyer.carTitle}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>
            {allBuyers.length} buyer{allBuyers.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Chat messages */}
      <div style={{
        height: '300px',
        overflowY: 'auto',
        padding: '16px',
        background: '#f8f9fb'
      }}>
        {loadingMessages ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender_id === sellerId ? 'flex-end' : 'flex-start',
              marginBottom: '12px'
            }}>
              <div style={{
                background: msg.sender_id === sellerId ? '#667eea' : '#e9ecef',
                color: msg.sender_id === sellerId ? 'white' : '#333',
                padding: '8px 12px',
                borderRadius: '12px',
                maxWidth: '70%',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.7, 
                  marginBottom: '4px',
                  fontWeight: 'bold'
                }}>
                  {msg.sender_name || (msg.sender_id === sellerId ? 'You' : 'Buyer')}
                </div>
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e0e0e0',
        background: '#fff'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            disabled={loading || !selectedBuyer}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim() || !selectedBuyer}
            style={{
              padding: '10px 16px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [myCars, setMyCars] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileFormData, setProfileFormData] = useState({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [buyersByCar, setBuyersByCar] = useState({});
  const [sellerId, setSellerId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [imageIndexes, setImageIndexes] = useState({});
  const [showChatModal, setShowChatModal] = useState(false);

  // Calculate stats
  const soldCars = myCars.filter(car => car.status === 'sold').length;
  const availableCars = myCars.filter(car => car.status === 'available').length;

  // Helper to get all images for a car
  const getAllImages = (car) => {
    const images = [];
    if (car.image_url && car.image_url.trim() !== '') images.push(car.image_url);
    if (car.additional_images && Array.isArray(car.additional_images)) images.push(...car.additional_images.filter(img => img && img.trim() !== ''));
    return images.length > 0 ? images : ['/carp2.png'];
  };

  useEffect(() => {
    const fetchSeller = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setSellerId(user.id);
    };
    fetchSeller();
  }, []);

  useEffect(() => {
    if (!sellerId) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', sellerId)
        .eq('read', false);
      setUnreadCount(count || 0);
    };
    fetchUnread();
  }, [sellerId]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
      console.log('Current user:', user);
      
      // Fetch profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
      console.log('User profile:', profile);
      
      // Fetch seller's cars directly from cars table
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('Fetched cars:', cars);
      console.log('Cars error:', carsError);
      console.log('Number of cars fetched:', cars?.length || 0);
      
      setMyCars(cars || []);
      
      // Fetch sales (purchases where seller is current user)
      const { data: salesData, error: salesError } = await supabase
        .from('purchases_with_details')
        .select('*')
        .eq('seller_id', user.id);
      
      if (salesError) {
        console.error('Error fetching from purchases_with_details:', salesError);
        setSales([]);
      } else {
        console.log('Sales with details:', salesData);
      setSales(salesData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [router]);

  // Fetch buyers for each car after myCars are loaded
  useEffect(() => {
    if (!myCars || myCars.length === 0 || !sellerId) return;
    const fetchAllBuyers = async () => {
      const buyersMap = {};
      for (const car of myCars) {
        const { data, error } = await supabase
          .from('messages')
          .select('sender_id, sender:profiles!messages_sender_id_fkey(full_name)')
          .eq('car_id', car.id)
          .eq('receiver_id', sellerId);
        // Deduplicate buyers by sender_id
        const uniqueBuyers = {};
        (data || []).forEach(row => {
          if (!uniqueBuyers[row.sender_id]) {
            uniqueBuyers[row.sender_id] = {
              id: row.sender_id,
              full_name: row.sender?.full_name
            };
          }
        });
        buyersMap[car.id] = Object.values(uniqueBuyers);
      }
      setBuyersByCar(buyersMap);
    };
    fetchAllBuyers();
  }, [myCars, sellerId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    router.push('/');
  };

  // Refresh data function
  const refreshData = async () => {
    setLoading(true);
    // Fetch seller's cars directly from cars table
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('Refreshed cars:', cars);
    console.log('Cars error:', carsError);
    
    setMyCars(cars || []);
    
    // Fetch sales (purchases where seller is current user)
    const { data: salesData, error: salesError } = await supabase
        .from('purchases_with_details')
      .select('*')
      .eq('seller_id', user.id);
    
      if (salesError) {
        console.error('Error fetching from purchases_with_details:', salesError);
        setSales([]);
      } else {
        console.log('Sales with details:', salesData);
    setSales(salesData || []);
      }
    setLoading(false);
  };

  // Delete car function
  const handleDeleteCar = async (carId) => {
    console.log('Delete car clicked for carId:', carId);
    
    if (!confirm('Are you sure you want to delete this car? This action cannot be undone.')) {
      console.log('Delete cancelled by user');
      return;
    }

    try {
      console.log('Attempting to delete car with ID:', carId);
      
      // Delete the car
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) {
        console.error('Delete error:', error);
        alert('Error deleting car: ' + error.message);
        return;
      }

      console.log('Car deleted successfully');
      
      // Show success message
      alert('✅ Car deleted successfully!');
      
      // Refresh the cars list
      refreshData();
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting car: ' + error.message);
    }
  };

  // Edit Profile logic
  const handleEditProfile = () => {
    setEditName(userProfile?.full_name || '');
    setEditEmail(user?.email || '');
    setEditingProfile(true);
    setProfileMsg('');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    if (!editName || !editEmail) {
      setProfileMsg('❌ Name and email are required.');
      return;
    }
    // Update profile in Supabase
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: editName })
      .eq('id', user.id);
    if (profileError) {
      setProfileMsg('❌ ' + profileError.message);
      return;
    }
    // Update email in auth
    const { error: emailError } = await supabase.auth.updateUser({ email: editEmail });
    if (emailError) {
      setProfileMsg('❌ ' + emailError.message);
      return;
    }
    setProfileMsg('✅ Profile updated successfully!');
    setUserProfile({ ...userProfile, full_name: editName });
    setEditingProfile(false);
    // Optionally, refresh user info
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    setUser(refreshedUser);
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

  return (
    <div>
      {/* Notification bell with unread count */}
      <div style={{ position: 'fixed', top: 24, right: 32, zIndex: 100 }}>
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span role="img" aria-label="Notifications" style={{ fontSize: 28 }}>🔔</span>
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: -8, right: -8, background: 'red', color: 'white', borderRadius: '50%', padding: '2px 7px', fontSize: 14, fontWeight: 'bold' }}>{unreadCount}</span>
          )}
        </span>
      </div>
      <Navbar logoText="Seller Dashboard" />
      <div className={styles.dashboardContainer}>
        <div className={styles.sidebar}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {userProfile?.full_name?.charAt(0) || 'S'}
            </div>
            <h3>{userProfile?.full_name || 'Seller'}</h3>
            <p>Car Seller</p>
          </div>
          
          <nav className={styles.sidebarNav}>
            <button 
              className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Dashboard
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'my-cars' ? styles.active : ''}`}
              onClick={() => setActiveTab('my-cars')}
            >
              My Cars
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'add-car' ? styles.active : ''}`}
              onClick={() => router.push('/add-car')}
            >
              Add New Car
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`${styles.navItem} ${styles.chatBtn}`}
              onClick={() => setShowChatModal(true)}
            >
              Chat {unreadCount > 0 && <span style={{ 
                background: '#ff6b6b', 
                color: 'white', 
                borderRadius: '50%', 
                padding: '2px 6px', 
                fontSize: '10px',
                marginLeft: '8px'
              }}>{unreadCount}</span>}
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'aihelp' ? styles.active : ''}`}
              onClick={() => setActiveTab('aihelp')}
            >
              🤖 AI Assistant
            </button>
            <button 
              className={`${styles.navItem} ${styles.logoutBtn}`}
              onClick={handleLogout}
            >
              Logout
            </button>
          </nav>
        </div>

        <div className={styles.mainContent}>
          {activeTab === 'overview' && (
            <div className={styles.overview}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>{myCars.length}</h3>
                  <p>Total Cars Listed</p>
                </div>
                <div className={styles.statCard}>
                  <h3>{soldCars}</h3>
                  <p>Cars Sold</p>
                </div>
                <div className={styles.statCard}>
                  <h3>{availableCars}</h3>
                  <p>Cars Available</p>
                </div>
                <div className={styles.statCard}>
                  <h3>{sales.length}</h3>
                  <p>Total Sales</p>
                </div>
              </div>

              <div className={styles.recentCars}>
                <h2>All Cars</h2>
                {myCars.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No cars listed yet. Start by adding your first car!</p>
                    <button 
                      className={styles.addCarBtn}
                      onClick={() => router.push('/add-car')}
                    >
                      Add Your First Car
                    </button>
                  </div>
                ) : (
                  <div className={styles.carsGrid}>
                    {myCars.map(car => (
                      <div key={car.id} style={{ marginBottom: 32 }}>
                            <h3>{car.title}</h3>
                        {/* Gallery block */}
                        <div className={styles.carImageContainer}>
                          {/* Main image */}
                          <img
                            src={getAllImages(car)[imageIndexes[car.id] || 0]}
                            alt={car.title}
                          />
                        </div>
                        {/* Thumbnails row - only show if more than 1 image */}
                        {getAllImages(car).length > 1 && (
                          <div className={styles.thumbnailsRow}>
                            {getAllImages(car).map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className={
                                  styles.thumbnail +
                                  ((imageIndexes[car.id] || 0) === idx ? ' ' + styles.activeThumbnail : '')
                                }
                                onClick={() => setImageIndexes(prev => ({ ...prev, [car.id]: idx }))}
                              />
                            ))}
                          </div>
                        )}
                        <p>{car.description}</p>
                            <p className={styles.price}>${car.price}</p>
                            <p className={car.status === 'sold' ? styles.sold : styles.available}>
                              {car.status === 'sold' ? 'Sold' : 'Available'}
                            </p>
                        {car.status === 'sold' && sales.find(s => (s.car_id === (car.car_id || car.id))) && (
                              <div className={styles.buyerInfo}>
                            <span>Buyer: <b>{sales.find(s => (s.car_id === (car.car_id || car.id)))?.buyer_name || 'N/A'}</b></span>
                            {sales.find(s => (s.car_id === (car.car_id || car.id)))?.buyer_email && (
                              <span style={{ marginLeft: 8, color: '#888' }}>({sales.find(s => (s.car_id === (car.car_id || car.id)))?.buyer_email})</span>
                            )}
                          </div>
                        )}
                        </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unified Chat Section */}
              {showChatModal && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000
                }}>
                  <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    width: '90%',
                    maxWidth: '600px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{
                      background: '#667eea',
                      color: 'white',
                      padding: '16px 20px',
                      borderBottom: '1px solid #e0e0e0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <h3 style={{ margin: '0' }}>💬 Chat with Buyers</h3>
                      <button onClick={() => setShowChatModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '24px' }}>×</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                      <UnifiedSellerChat sellerId={sellerId} myCars={myCars} buyersByCar={buyersByCar} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'my-cars' && (
            <div className={styles.myCars}>
              {myCars.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>You haven't listed any cars yet.</p>
                  <button 
                    className={styles.addCarBtn}
                    onClick={() => router.push('/add-car')}
                  >
                    List Your First Car
                  </button>
                </div>
              ) : (
                <div className={styles.carsGrid}>
                  {myCars.map(car => {
                    const sale = sales.find(s => (s.car_id === (car.car_id || car.id)));
                    return (
                      <div key={car.car_id || car.id} className={styles.carCard}>
                        {/* Gallery block */}
                        <div className={styles.carImageContainer}>
                          {/* Main image */}
                          <img
                            src={getAllImages(car)[imageIndexes[car.id] || 0]}
                            alt={car.title}
                          />
                          {/* Thumbnails row */}
                          {getAllImages(car).length > 1 && (
                            <div className={styles.thumbnailsRow}>
                              {getAllImages(car).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Thumbnail ${idx + 1}`}
                                  className={
                                    styles.thumbnail +
                                    ((imageIndexes[car.id] || 0) === idx ? ' ' + styles.activeThumbnail : '')
                                  }
                                  onClick={() => setImageIndexes(prev => ({ ...prev, [car.id]: idx }))}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={styles.carInfo}>
                          <h3>{car.title}</h3>
                          <p>{car.description}</p>
                          <p className={styles.price}>${car.price}</p>
                          <p className={car.status === 'sold' ? styles.sold : styles.available}>
                            {car.status === 'sold' ? 'Sold' : 'Available'}
                          </p>
                          {car.status === 'sold' && sales.find(s => s.car_id === car.id) && (
                            <div className={styles.buyerInfo}>
                              {(() => {
                                const sale = sales.find(s => s.car_id === car.id);
                                return (
                                  <>
                                    <span>Buyer: <b>{sale.buyer_name || 'N/A'}</b></span>
                                    {sale.buyer_email && (
                                      <span style={{ marginLeft: 8, color: '#888' }}>({sale.buyer_email})</span>
                                    )}
                                    {/* WhatsApp Contact Button for Buyer */}
                                    {sale.buyer_whatsapp && (
                                      <button
                                        onClick={() => {
                                          const buyerName = sale.buyer_name || 'Buyer';
                                          const whatsappNumber = sale.buyer_whatsapp;
                                          const message = `Hi ${buyerName}, regarding your purchase of ${car.title}. How is everything going?`;
                                          const whatsappLink = `https://wa.me/${formatWhatsAppNumber(whatsappNumber)}?text=${encodeURIComponent(message)}`;
                                          window.open(whatsappLink, '_blank');
                                        }}
                                        style={{
                                          background: '#25D366',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: 6,
                                          padding: '6px 12px',
                                          fontSize: '11px',
                                          fontWeight: 'bold',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 4,
                                          marginTop: 6,
                                          width: '100%',
                                          justifyContent: 'center',
                                          transition: 'background 0.2s'
                                        }}
                                        onMouseOver={(e) => e.target.style.background = '#128C7E'}
                                        onMouseOut={(e) => e.target.style.background = '#25D366'}
                                      >
                                        <span>📱</span>
                                        Contact Buyer
                                      </button>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          <div className={styles.carActions}>
                            <button 
                              className={styles.editBtn}
                              onClick={() => router.push(`/edit-car/${car.car_id || car.id}`)}
                              disabled={car.status === 'sold'}
                              style={car.status === 'sold' ? { background: '#ccc', color: '#888', cursor: 'not-allowed' } : {}}
                            >Edit</button>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteCar(car.car_id || car.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className={styles.profile}>
              <h1>Profile Settings</h1>
              <div className={styles.profileCard}>
                <div className={styles.profileInfo}>
                  <div className={styles.avatar}>
                    {userProfile?.full_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h3>{userProfile?.full_name || 'Seller'}</h3>
                    <p>{user?.email}</p>
                    <p>Car Seller</p>
                  </div>
                </div>
                <button className={styles.editProfileBtn} onClick={handleEditProfile}>Edit Profile</button>
              </div>
              {editingProfile && (
                <form onSubmit={handleProfileUpdate} className={styles.authForm} style={{ maxWidth: 400, margin: '1rem auto' }}>
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>
                  <button type="submit" className={styles.submitBtn}>Save</button>
                  <button type="button" className={styles.submitBtn} style={{ background: '#ccc', color: '#333', marginLeft: 8 }} onClick={() => setEditingProfile(false)}>Cancel</button>
                  {profileMsg && (
                    <div className={`${styles.message} ${profileMsg.startsWith('✅') ? styles.success : styles.error}`} style={{ marginTop: 10 }}>{profileMsg}</div>
                  )}
                </form>
              )}
            </div>
          )}
          {activeTab === 'aihelp' && (
            <div className={styles.aiAssistant}>
              <div className={styles.sectionHeader}>
                <h1>🤖 AI Car Assistant</h1>
                <p>Car selling ke liye expert advice len! Market analysis, pricing tips aur zyada.</p>
              </div>
              <div className={styles.chatSection}>
                <AIChat 
                  context="seller-dashboard"
                  isFloating={false}
                  userId={user?.id}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer userType="seller" />
    </div>
  );
} 