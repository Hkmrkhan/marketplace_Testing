import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';
import styles from '../styles/Dashboard.module.css';
import dynamic from 'next/dynamic';
const StripeCheckoutModal = dynamic(() => import('../components/StripeCheckout'), { ssr: false });

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
      
      console.log('Fetched purchases with details:', buyerPurchases);
      console.log('Purchases error:', purchasesError);
      console.log('Number of purchases:', buyerPurchases?.length || 0);
      
      setPurchases(buyerPurchases || []);
      
      // Fetch available cars with seller details - using seller_id as seller reference
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select(`
          *,
          seller:profiles!cars_seller_id_fkey (
            full_name,
            email
          )
        `)
        .eq('status', 'available');
      
      console.log('Fetched available cars with seller details:', cars);
      console.log('Cars error:', carsError);
      console.log('Number of available cars:', cars?.length || 0);
      
      // Debug: Check ALL cars regardless of status
      const { data: allCars, error: allCarsError } = await supabase
        .from('cars')
        .select('*');
      
      console.log('ALL cars in database:', allCars);
      console.log('All cars error:', allCarsError);
      console.log('Total cars count:', allCars?.length || 0);
      
      // Debug: Check cars with different statuses
      if (allCars) {
        const statusCounts = {};
        allCars.forEach(car => {
          statusCounts[car.status] = (statusCounts[car.status] || 0) + 1;
        });
        console.log('Cars by status:', statusCounts);
        
        // Debug: Show each car's status
        allCars.forEach(car => {
          console.log(`Car ID: ${car.id}, Title: ${car.title}, Status: ${car.status}`);
        });
      }
      
      // Debug: Test cars without join to see if foreign key is the issue
      const { data: carsWithoutJoin, error: carsWithoutJoinError } = await supabase
        .from('cars')
        .select('*')
        .eq('status', 'available');
      
      console.log('Available cars WITHOUT join:', carsWithoutJoin);
      console.log('Cars without join error:', carsWithoutJoinError);
      
      // Double check - filter out any cars that might have wrong status
      const filteredCars = cars?.filter(car => car.status === 'available') || [];
      console.log('Filtered available cars:', filteredCars);
      
      // Fallback: If join fails, use cars without seller details
      if (filteredCars.length === 0 && carsWithoutJoin && carsWithoutJoin.length > 0) {
        console.log('Using fallback - cars without seller details');
        setAvailableCars(carsWithoutJoin);
      } else {
        setAvailableCars(filteredCars);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [router]);

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

  const handlePurchase = async (carId) => {
    try {
      console.log('Purchase initiated for carId:', carId);
      
      // Get car details to find seller_id
      const carToPurchase = availableCars.find(car => car.id === carId);
      if (!carToPurchase) {
        console.log('Car not found in available cars');
        alert('Car not found!');
        return;
      }
      
      // Check if car is already sold
      if (carToPurchase.status !== 'available') {
        console.log('Car is already sold:', carToPurchase.status);
        alert('This car is already sold!');
        return;
      }
      
      console.log('Car to purchase:', carToPurchase);

      // Insert purchase record with all required fields
      const purchaseData = {
        car_id: carId,
        buyer_id: user.id,
        seller_id: carToPurchase.seller_id, // Use seller_id field
        amount: carToPurchase.price,
        purchase_date: new Date().toISOString()
      };
      
      console.log('Purchase data to insert:', purchaseData);
      console.log('Car seller_id:', carToPurchase.seller_id);
      
      const { data: purchaseResult, error: purchaseError } = await supabase
        .from('purchases')
        .insert([purchaseData])
        .select();

      console.log('Purchase insert result:', { purchaseResult, purchaseError });

      if (purchaseError) {
        console.error('Purchase error:', purchaseError);
        alert('Error making purchase: ' + purchaseError.message);
        return;
      }

      // Update car status to sold
      const { data: updateResult, error: carError } = await supabase
        .from('cars')
        .update({ status: 'sold' })
        .eq('id', carId)
        .select();

      console.log('Car status update result:', { updateResult, carError });

      if (carError) {
        console.error('Car update error:', carError);
        alert('Warning: Purchase successful but car status update failed. Please use "Fix Sold Cars" button.');
        
        // Continue with the flow even if status update fails
        // The fix button will handle this later
      } else {
        console.log('Car status successfully updated to sold');
      }

      // Show success message
      alert('✅ Car purchased successfully! Check My Purchases tab.');
      
      // Remove the purchased car from available cars list immediately
      setAvailableCars(prevCars => {
        const filtered = prevCars.filter(car => car.id !== carId);
        console.log('Filtered available cars:', filtered);
        return filtered;
      });
      
      // Manually refresh available cars from database
      const { data: refreshedCars, error: refreshError } = await supabase
        .from('cars')
        .select(`
          *,
          seller:profiles!cars_seller_id_fkey (
            full_name,
            email
          )
        `)
        .eq('status', 'available');
      
      console.log('Manually refreshed available cars:', refreshedCars);
      console.log('Refresh error:', refreshError);
      
      // Double check - filter out any cars that might have wrong status
      const filteredRefreshedCars = refreshedCars?.filter(car => car.status === 'available') || [];
      console.log('Filtered refreshed cars:', filteredRefreshedCars);
      
      setAvailableCars(filteredRefreshedCars);
      
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
      
      console.log('Refreshed purchases:', updatedPurchases);
      console.log('Purchases refresh error:', purchasesRefreshError);
      
      setPurchases(updatedPurchases || []);
      
      // Switch to purchases tab to show the new purchase
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
              <div className={styles.sectionHeader}>
                <h1>Available Cars</h1>
              </div>
              {availableCars.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No cars available for purchase at the moment.</p>
                </div>
              ) : (
                <div className={styles.carsGrid}>
                  {availableCars.map(car => (
                    <div key={car.id} className={styles.carCard}>
                      <img src={car.image_url || '/carp2.png'} alt={car.title} />
                      <div className={styles.carInfo}>
                        <h3>{car.title}</h3>
                        <p>{car.description}</p>
                        <p className={styles.price}>${car.price}</p>
                        <div className={styles.sellerInfo}>
                          <span>Seller: <b>{car.seller?.full_name || 'N/A'}</b></span>
                          {car.seller?.email && <span style={{ marginLeft: 8, color: '#888' }}>({car.seller.email})</span>}
                        </div>
                        {car.status === 'available' ? (
                          <button 
                            className={styles.buyBtn}
                            onClick={() => setCheckoutCar(car)}
                          >
                            Buy Now
                          </button>
                        ) : (
                          <div className={styles.soldBadge}>
                            Sold
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                    <div key={purchase.id} className={styles.carCard}>
                      <img
                        src={purchase.cars?.image_url || "/carp2.png"}
                        alt={purchase.cars?.title || "Car"}
                      />
                      <div className={styles.carInfo}>
                        <h3>{purchase.cars?.title || "Car"}</h3>
                        <p>{purchase.cars?.description}</p>
                        <p className={styles.price}>${purchase.cars?.price}</p>
                        <div className={styles.sellerInfo}>
                          <span>
                            Seller: <b>{purchase.seller?.full_name || "N/A"}</b>
                          </span>
                          {purchase.seller?.email && (
                            <span style={{ marginLeft: 8, color: "#888" }}>
                              ({purchase.seller.email})
                            </span>
                          )}
                        </div>
                        <div className={styles.soldBadge}>Purchased</div>
                      </div>
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
                // 1. Save payment in Supabase
                await fetch('/api/save-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    carId: checkoutCar.id,
                    userId: user.id,
                    amount: checkoutCar.price,
                    stripe_payment_id: paymentIntent.id,
                    status: paymentIntent.status
                  })
                });
                // 2. Refresh data, close modal
                setCheckoutCar(null);
                alert('Payment successful! Car marked as sold.');
                window.location.reload();
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