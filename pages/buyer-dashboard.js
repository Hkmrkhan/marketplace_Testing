import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIChat from '../components/AIChat';
import { supabase } from '../utils/supabaseClient';
import styles from '../styles/Dashboard.module.css';
import dynamic from 'next/dynamic';
const StripeCheckoutModal = dynamic(() => import('../components/StripeCheckout'), { ssr: false });

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

function CarChat({ carId, sellerId, buyerId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages_with_names')
        .select('*')
        .eq('car_id', carId)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Use the names directly from the view
      const formattedMessages = data?.map(msg => ({
        ...msg,
        sender_name: msg.sender_name || (msg.sender_id === currentUserId ? 'You' : 'Seller'),
        receiver_name: msg.receiver_name || (msg.receiver_id === currentUserId ? 'You' : 'Seller')
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('messages')
        .insert([{
          car_id: carId,
          sender_id: currentUserId,
          receiver_id: sellerId,
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
      setSending(false);
    }
  };

  useEffect(() => {
    if (carId && currentUserId && sellerId) {
      fetchMessages();
    }
  }, [carId, currentUserId, sellerId]);

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length]);

  if (loadingMessages) return <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>Loading messages...</div>;

  return (
    <div className="car-chat-box" style={{
      width: '100%',
      maxWidth: 340,
      minWidth: 260,
      height: 200,
      background: '#fff',
      borderRadius: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      padding: '12px 12px 8px 12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      margin: '0 auto'
    }}>
      <div className="car-chat-messages" style={{
        height: 130,
        overflowY: 'auto',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 12,
        background: '#f8f9fb',
        marginBottom: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
        {messages.length === 0 ? (
          <div className="car-chat-empty" style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No messages yet.</div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender_id === currentUserId ? 'flex-end' : 'flex-start',
              marginBottom: 4
            }}>
              <div style={{
                background: msg.sender_id === currentUserId ? '#007bff' : '#e9ecef',
                color: msg.sender_id === currentUserId ? 'white' : '#333',
                padding: '6px 10px',
                borderRadius: 12,
                maxWidth: '80%',
                fontSize: '12px',
                lineHeight: 1.3,
                wordWrap: 'break-word'
              }}>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '11px',
                  marginBottom: 2,
                  opacity: 0.9
                }}>
                  {msg.sender_name}
                </div>
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.inputContainer}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Type your message..."
          className={styles.messageInput}
          rows="1"
          disabled={sending}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() || sending}
          className={styles.sendButton}
        >
          {sending ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}

export default function BuyerDashboard() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [availableCars, setAvailableCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const router = useRouter();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [checkoutCar, setCheckoutCar] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatCarId, setChatCarId] = useState(null);
  const [chatSellerId, setChatSellerId] = useState(null);
  const [buyerId, setBuyerId] = useState(null);
  const [imageIndexes, setImageIndexes] = useState({}); // carId: index

  // Helper to get all images for a car
  const getAllImages = (car) => {
    const images = [];
    
    // Handle both view data and fallback data structures
    const imageUrl = car.image_url || car.cars?.image_url;
    const additionalImages = car.additional_images || car.cars?.additional_images;
    
    if (imageUrl && imageUrl.trim() !== '') images.push(imageUrl);
    if (additionalImages && Array.isArray(additionalImages)) {
      images.push(...additionalImages.filter(img => img && img.trim() !== ''));
    }
    
    return images.length > 0 ? images : ['/carp2.png'];
  };

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
      console.log('Buyer user:', user);
      
      // Fetch profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
      console.log('Buyer profile:', profile);
      
      // Check if user is a buyer
      if (profile?.user_type !== 'buyer') {
        router.push('/seller-dashboard');
        return;
      }
      
      // Fetch purchases for this buyer with car and seller details
      const { data: buyerPurchases, error: purchasesError } = await supabase
        .from('purchases_with_details')
        .select('*')
        .eq('buyer_id', user.id);
      
      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError);
        // Fallback to manual joins
        const { data: fallbackPurchases, error: fallbackError } = await supabase
        .from('purchases')
        .select(`
          *,
          cars:car_id (
            title,
            description,
            price,
              image_url,
              additional_images
          ),
          seller:profiles!purchases_seller_id_fkey (
            full_name,
              email,
              whatsapp_number
          )
        `)
        .eq('buyer_id', user.id);
      
        if (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          setPurchases([]);
        } else {
          // Transform fallback data
          const transformedPurchases = fallbackPurchases?.map(purchase => ({
            id: purchase.id,
            car_id: purchase.car_id,
            buyer_id: purchase.buyer_id,
            seller_id: purchase.seller_id,
            amount: purchase.amount,
            purchase_date: purchase.purchase_date,
            title: purchase.cars?.title,
            description: purchase.cars?.description,
            price: purchase.cars?.price,
            image_url: purchase.cars?.image_url,
            additional_images: purchase.cars?.additional_images,
            status: purchase.cars?.status,
            seller_name: purchase.seller?.full_name,
            seller_email: purchase.seller?.email,
            seller_whatsapp: purchase.seller?.whatsapp_number
          })) || [];
          setPurchases(transformedPurchases);
        }
      } else {
      console.log('Fetched purchases with details:', buyerPurchases);
      console.log('Number of purchases:', buyerPurchases?.length || 0);
      setPurchases(buyerPurchases || []);
      }
      
      // Fetch available cars with seller details and approval status
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select(`
          *,
          seller_id,
          admin_approvals(
            approval_status,
            approved_at
          )
        `)
        .eq('status', 'available');
      
      console.log('Cars with seller_id:', cars);
      console.log('Cars error:', carsError);
      
      // Now fetch seller details for each car
      if (cars && cars.length > 0) {
        const carsWithSellerDetails = await Promise.all(
          cars.map(async (car) => {
            if (car.seller_id) {
              const { data: sellerData, error: sellerError } = await supabase
                .from('profiles')
                .select('full_name, email, whatsapp_number')
                .eq('id', car.seller_id)
                .single();
              
              console.log(`Seller data for car ${car.title}:`, sellerData);
              
              return {
                ...car,
                seller: sellerData
              };
            }
            return car;
          })
        );
        
        console.log('Cars with seller details:', carsWithSellerDetails);
        
        // Filter approved cars for buyer
        const approvedCars = carsWithSellerDetails.filter(car => {
          console.log('Car:', car.title, 'Admin approvals:', car.admin_approvals);
          
          // Check if car has approval record
          if (car.admin_approvals && car.admin_approvals.length > 0) {
            const latestApproval = car.admin_approvals[car.admin_approvals.length - 1];
            console.log('Latest approval for', car.title, ':', latestApproval);
            
            // Only show if latest approval is 'approved'
            if (latestApproval.approval_status === 'approved') {
              console.log('Car approved:', car.title);
              return true;
            } else {
              console.log('Car not approved:', car.title);
              return false;
            }
          }
          
          // If no approval record, don't show it (new cars need approval)
          console.log('No approval record for', car.title, '- not showing');
          return false;
        });
        
        console.log('Approved cars for buyer:', approvedCars);
        console.log('Number of approved cars:', approvedCars.length);
        setAvailableCars(approvedCars);
      } else {
        setAvailableCars([]);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [router]);

  useEffect(() => {
    const fetchBuyer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setBuyerId(user.id);
      else setBuyerId(null);
    };
    fetchBuyer();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    router.push('/');
  };

  // Function to manually fix sold cars in database
  const fixSoldCars = async () => {
    try {
      console.log('Fixing sold cars in database...');
      
      // First, let's check the purchases table structure
      const { data: allPurchases, error: allPurchasesError } = await supabase
        .from('purchases')
        .select('*');
      
      console.log('All purchases table data:', allPurchases);
      console.log('Purchases table structure:', allPurchases?.[0] ? Object.keys(allPurchases[0]) : 'No data');
      console.log('All purchases error:', allPurchasesError);
      
      if (allPurchasesError) {
        console.error('Error fetching all purchases:', allPurchasesError);
        alert('❌ Error fetching purchases: ' + allPurchasesError.message);
        return;
      }
      
      // Check if car_id column exists
      if (allPurchases && allPurchases.length > 0) {
        const firstPurchase = allPurchases[0];
        console.log('First purchase record:', firstPurchase);
        console.log('Available columns:', Object.keys(firstPurchase));
        
        // Check if car_id exists
        if (!firstPurchase.car_id) {
          console.log('car_id column does not exist in purchases table!');
          alert('❌ car_id column missing in purchases table. Please check database schema.');
          
          // Alternative approach: Try to find cars by buyer/seller relationship
          console.log('Trying alternative approach using buyer/seller relationship...');
          
          // Get all unique buyer-seller pairs from purchases
          const buyerSellerPairs = allPurchases.map(p => ({
            buyer_id: p.buyer_id,
            seller_id: p.seller_id
          }));
          
          console.log('Buyer-seller pairs from purchases:', buyerSellerPairs);
          
          // For now, just show the data and ask user to check database
          alert('Please check your database schema. Purchases table should have car_id column.');
          return;
        }
      }
      
      // Get all cars that should be sold (have purchase records)
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('car_id');
      
      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError);
        alert('❌ Error fetching purchases: ' + purchasesError.message);
        return;
      }
      
      console.log('Cars with purchase records:', purchases);
      console.log('Number of purchase records:', purchases?.length || 0);
      
      // Check if any car_id values are null or invalid
      if (purchases && purchases.length > 0) {
        const validCarIds = purchases.filter(p => p.car_id && p.car_id !== null);
        const nullCarIds = purchases.filter(p => !p.car_id || p.car_id === null);
        
        console.log('Valid car_ids:', validCarIds);
        console.log('Null car_ids:', nullCarIds);
        console.log('Valid car_ids count:', validCarIds.length);
        console.log('Null car_ids count:', nullCarIds.length);
        
        if (validCarIds.length === 0) {
          alert('❌ No valid car_id found in purchases table. All car_id values are null!');
          return;
        }
        
        const soldCarIds = validCarIds.map(p => p.car_id);
        console.log('Car IDs that should be sold:', soldCarIds);
        
        // First, let's check current status of these cars
        const { data: currentCars, error: currentError } = await supabase
          .from('cars')
          .select('id, title, status')
          .in('id', soldCarIds);
        
        console.log('Current status of cars to be sold:', currentCars);
        
        if (currentError) {
          console.error('Error fetching current car status:', currentError);
          alert('❌ Error checking car status: ' + currentError.message);
          return;
        }
        
        // Update these cars to sold status
        const { data: updateResult, error: updateError } = await supabase
          .from('cars')
          .update({ status: 'sold' })
          .in('id', soldCarIds)
          .select('id, title, status');
        
        console.log('Update result:', updateResult);
        console.log('Update error:', updateError);
        
        if (updateError) {
          console.error('Error updating car status:', updateError);
          alert('❌ Error updating car status: ' + updateError.message);
          
          // Try alternative approach - update one by one
          console.log('Trying alternative approach...');
          let successCount = 0;
          for (const carId of soldCarIds) {
            const { error: singleError } = await supabase
              .from('cars')
              .update({ status: 'sold' })
              .eq('id', carId);
            
            if (!singleError) {
              successCount++;
            } else {
              console.error(`Error updating car ${carId}:`, singleError);
            }
          }
          
          alert(`✅ Updated ${successCount} out of ${soldCarIds.length} cars to sold status.`);
        } else {
          alert(`✅ Successfully updated ${updateResult?.length || 0} cars to sold status!`);
        }
        
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } else {
        alert('No purchase records found.');
      }
    } catch (error) {
      console.error('Error fixing sold cars:', error);
      alert('Error: ' + error.message);
    }
  };

  // Refactor handlePurchase to accept car object directly
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
        buyer_id: user.id,
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
        alert('Warning: Purchase successful but car status update failed. Please use "Fix Sold Cars" button.');
      }
      alert('✅ Car purchased successfully! Check My Purchases tab.');
      setAvailableCars(prevCars => prevCars.filter(c => c.id !== car.id));
      // Refresh purchases list
      const { data: updatedPurchases, error: purchasesRefreshError } = await supabase
        .from('purchases')
        .select(`
          *,
          cars:car_id (
            title,
            description,
            price,
            image_url
          ),
          seller:profiles!purchases_seller_id_fkey (
            full_name,
            email
          )
        `)
        .eq('buyer_id', user.id);
      setPurchases(updatedPurchases || []);
      setActiveTab('purchases');
    } catch (error) {
      console.error('Error:', error);
      alert('Error making purchase: ' + error.message);
    }
  };

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

  // Place this useEffect at the top level of the component, not inside any other function or block
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        // Use purchases_with_details view for better data
        const { data, error } = await supabase
          .from('purchases_with_details')
          .select('*')
          .eq('buyer_id', user.id);
        
        if (error) {
          console.error('Error fetching from purchases_with_details:', error);
          
          // Fallback: fetch with manual joins
          console.log('Trying fallback approach...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('purchases')
            .select(`
              *,
              cars:car_id (
                id,
                title,
                description,
                price,
                image_url,
                additional_images,
                status
              ),
              seller:profiles!purchases_seller_id_fkey (
                full_name,
                email,
                whatsapp_number
              )
            `)
            .eq('buyer_id', user.id);
          
          if (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            setPurchases([]);
            return;
          }
          
          // Transform fallback data to match view format
          const transformedData = fallbackData?.map(purchase => ({
            id: purchase.id,
            car_id: purchase.car_id,
            buyer_id: purchase.buyer_id,
            seller_id: purchase.seller_id,
            amount: purchase.amount,
            purchase_date: purchase.purchase_date,
            title: purchase.cars?.title,
            description: purchase.cars?.description,
            price: purchase.cars?.price,
            image_url: purchase.cars?.image_url,
            additional_images: purchase.cars?.additional_images,
            status: purchase.cars?.status,
            seller_name: purchase.seller?.full_name,
            seller_email: purchase.seller?.email,
            seller_whatsapp: purchase.seller?.whatsapp_number
          })) || [];
          
          console.log('Fallback data:', transformedData);
          setPurchases(transformedData);
          return;
        }
        
        console.log('Purchases with details:', data);
        console.log('Number of purchases:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('First purchase sample:', data[0]);
          console.log('Available fields:', Object.keys(data[0]));
        }
        setPurchases(data || []);
      } catch (error) {
        console.error('Error in fetchPurchases:', error);
        setPurchases([]);
      }
    };
    if (user) fetchPurchases();
  }, [user]);

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
      <Navbar logoText="Buyer Dashboard" />
      <div className={styles.dashboardContainer}>
        <div className={styles.sidebar}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {userProfile?.full_name?.charAt(0) || 'B'}
            </div>
            <h3>{userProfile?.full_name || 'Buyer'}</h3>
            <p>Car Buyer</p>
          </div>
          <nav className={styles.sidebarNav}>
            <button 
              className={`${styles.navItem} ${activeTab === 'browse' ? styles.active : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              Dashboard
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'purchases' ? styles.active : ''}`}
              onClick={() => setActiveTab('purchases')}
            >
              My Purchases
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
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
          {activeTab === 'browse' && (
            <div className={styles.browseCars}>
              {/* Overview Stats Section */}
              <div className={styles.overviewStats}>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>🚗</div>
                    <h3>Available Cars</h3>
                    <p className={styles.statNumber}>{availableCars.length}</p>
                    <small>Cars ready for purchase</small>
                  </div>
                  
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>💰</div>
                    <h3>Total Purchases</h3>
                    <p className={styles.statNumber}>{purchases.length}</p>
                    <small>Cars you've bought</small>
                  </div>
                  
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>👤</div>
                    <h3>Your Profile</h3>
                    <p className={styles.statNumber}>Active</p>
                    <small>Account status</small>
                  </div>
                </div>
              </div>
              
              {availableCars.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No cars available for purchase at the moment.</p>
                </div>
              ) : (
                <div className={styles.carsGrid}>
                  {availableCars.map(car => {
                    console.log('Car in map:', car); // Debug: Check seller_id in each car
                    return (
                      <div key={car.id} style={{ marginBottom: 32 }}>
                          <h3>{car.title}</h3>
                        {/* Gallery block - same as seller dashboard */}
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
                          <div className={styles.sellerInfo}>
                            <span>Seller: <b>{car.seller?.full_name || 'N/A'}</b></span>
                            {car.seller?.email && <span style={{ marginLeft: 8, color: '#888' }}>({car.seller.email})</span>}
                          </div>
                          {car.status === 'available' ? (
                            <button 
                              className={styles.buyBtn}
                            onClick={() => setCheckoutCar({ ...car, seller_id: car.seller_id })}
                            >
                              Buy Now
                            </button>
                          ) : (
                            <div className={styles.soldBadge}>
                              Sold
                          </div>
                        )}
                        {/* Chat and WhatsApp buttons for each car */}
                        <div style={{ marginTop: 12 }}>
                          <CarChat carId={car.id} sellerId={car.seller_id} buyerId={buyerId} currentUserId={user?.id} />
                          
                          {/* Debug: Log seller data */}
                          {console.log('Car:', car.title)}
                          {console.log('Car seller data:', car.seller)}
                          {console.log('Seller ID:', car.seller_id)}
                          {console.log('WhatsApp number:', car.seller?.whatsapp_number)}
                          {console.log('Seller name:', car.seller?.full_name)}
                          {console.log('Has WhatsApp number?', !!car.seller?.whatsapp_number)}
                          
                          {/* WhatsApp Contact Button */}
                          {car.seller?.whatsapp_number ? (
                            <button
                              onClick={() => {
                                const sellerName = car.seller?.full_name || 'Seller';
                                const whatsappNumber = car.seller.whatsapp_number;
                                const message = `Hi ${sellerName}, I'm interested in your car ${car.title}. Can you provide more details?`;
                                const whatsappLink = `https://wa.me/${formatWhatsAppNumber(whatsappNumber)}?text=${encodeURIComponent(message)}`;
                                window.open(whatsappLink, '_blank');
                              }}
                              style={{
                                background: '#25D366',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 8,
                                width: '100%',
                                justifyContent: 'center',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.target.style.background = '#128C7E'}
                              onMouseOut={(e) => e.target.style.background = '#25D366'}
                            >
                              <span>📱</span>
                              Contact via WhatsApp
                            </button>
                          ) : (
                            <div style={{ 
                              marginTop: 8, 
                              padding: '8px', 
                              background: '#f0f0f0', 
                              borderRadius: 8, 
                              fontSize: '12px', 
                              color: '#666',
                              textAlign: 'center'
                            }}>
                              No WhatsApp contact available
                              {console.log('No WhatsApp number for seller:', car.seller?.full_name)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {activeTab === 'purchases' && (
            <div>
              <h1 className={styles.pageTitle}>My Purchases</h1>
              {purchases.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>You have not purchased any cars yet.</p>
                </div>
              ) : (
                <div className={styles.purchases}>
                  {purchases.map((purchase) => (
                    <div key={purchase.id} style={{ marginBottom: 32 }}>
                      <h3>{purchase.title || purchase.cars?.title || "Car"}</h3>
                      {/* Gallery block for purchased cars - same as seller dashboard */}
                      <div className={styles.carImageContainer}>
                        {/* Main image */}
                        <img
                          src={getAllImages(purchase)[imageIndexes[purchase.id] || 0]}
                          alt={purchase.title || purchase.cars?.title || "Car"}
                        />
                        {/* Thumbnails row */}
                        {getAllImages(purchase).length > 1 && (
                          <div className={styles.thumbnailsRow}>
                            {getAllImages(purchase).map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className={
                                  styles.thumbnail +
                                  ((imageIndexes[purchase.id] || 0) === idx ? ' ' + styles.activeThumbnail : '')
                                }
                                onClick={() => setImageIndexes(prev => ({ ...prev, [purchase.id]: idx }))}
                              />
                            ))}
                          </div>
                          )}
                        </div>
                      <p>{purchase.description || purchase.cars?.description}</p>
                      <p className={styles.price}>${purchase.price || purchase.cars?.price || 'N/A'}</p>
                      <div className={styles.sellerInfo}>
                        <div>Seller: <b>{purchase.seller_name || purchase.seller?.full_name || 'Unknown'}</b></div>
                        {(purchase.seller_email || purchase.seller?.email) && (
                          <div style={{ color: '#888', fontSize: '12px' }}>
                            {purchase.seller_email || purchase.seller?.email}
                          </div>
                        )}
                        {/* WhatsApp Contact Button for Seller */}
                        {(purchase.seller_whatsapp || purchase.seller?.whatsapp_number) && (
                          <button
                            onClick={() => {
                              const sellerName = purchase.seller_name || purchase.seller?.full_name || 'Seller';
                              const whatsappNumber = purchase.seller_whatsapp || purchase.seller?.whatsapp_number;
                              const carTitle = purchase.title || purchase.cars?.title || 'Car';
                              const message = `Hi ${sellerName}, regarding my purchase of ${carTitle}. How is everything going?`;
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
                            Contact Seller
                          </button>
                        )}
                      </div>
                      <div className={styles.soldBadge}>Purchased</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'profile' && (
            <div className={styles.profile}>
              <h1>Profile</h1>
              <div className={styles.profileCard}>
                <div className={styles.profileInfo}>
                  <div className={styles.avatar}>
                    {userProfile?.full_name?.charAt(0) || 'B'}
                  </div>
                  <div>
                    <h3>{userProfile?.full_name || 'Buyer'}</h3>
                    <p>{user?.email}</p>
                    <p>Car Buyer</p>
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
                <p>Car buying ke liye koi b sawal pooch sktay hein.</p>
              </div>
              <div className={styles.chatSection}>
                <AIChat 
                  context="buyer-dashboard"
                  isFloating={false}
                  userId={user?.id}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {checkoutCar && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 350 }}>
            <h2>Pay for {checkoutCar.title}</h2>
            <StripeCheckoutModal
              car={checkoutCar}
              userId={user.id}
              onSuccess={async (paymentIntent) => {
                await handlePurchase(checkoutCar); // Insert purchase from frontend (old working way)
                setCheckoutCar(null);
                alert('Payment successful! Car marked as sold.');
              }}
            />
            <button onClick={() => setCheckoutCar(null)} style={{ marginTop: 16 }}>Cancel</button>
          </div>
        </div>
      )}
      <Footer userType="buyer" />
    </div>
  );
} 