import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';
import styles from '../styles/Dashboard.module.css';

export default function SellerDashboard() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [myCars, setMyCars] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const router = useRouter();

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
        .from('purchases')
        .select(`
          *,
          buyer:profiles!purchases_buyer_id_fkey (
            full_name,
            email
          )
        `)
        .eq('seller_id', user.id);
      
      console.log('Fetched sales:', salesData);
      console.log('Sales error:', salesError);
      
      setSales(salesData || []);
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
      .from('purchases')
      .select('*')
      .eq('seller_id', user.id);
    
    console.log('Refreshed sales:', salesData);
    console.log('Sales error:', salesError);
    
    setSales(salesData || []);
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

  // Calculate stats
  const totalCars = myCars.length;
  const soldCars = myCars.filter(car => car.status === 'sold').length;
  const availableCars = myCars.filter(car => car.status === 'available').length;

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
                  <h3>{totalCars}</h3>
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
                    {myCars.map(car => {
                      const sale = sales.find(s => (s.car_id === (car.car_id || car.id)));
                      return (
                        <div key={car.car_id || car.id} className={styles.carCard}>
                          <img src={car.image_url ? car.image_url : (car.image ? car.image : '/carp2.png')} alt={car.title} />
                          <div className={styles.carInfo}>
                            <h3>{car.title}</h3>
                            <p className={styles.price}>${car.price}</p>
                            <p className={car.status === 'sold' ? styles.sold : styles.available}>
                              {car.status === 'sold' ? 'Sold' : 'Available'}
                            </p>
                            {car.status === 'sold' && sale && (
                              <div className={styles.buyerInfo}>
                                <span>Buyer: <b>{sale.buyer?.full_name || 'N/A'}</b></span>
                                {sale.buyer?.email && (
                                  <span style={{ marginLeft: 8, color: '#888' }}>({sale.buyer.email})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
                        <img src={car.image_url ? car.image_url : (car.image ? car.image : '/carp2.png')} alt={car.title} />
                        <div className={styles.carInfo}>
                          <h3>{car.title}</h3>
                          <p>{car.description}</p>
                          <p className={styles.price}>${car.price}</p>
                          <p className={car.status === 'sold' ? styles.sold : styles.available}>
                            {car.status === 'sold' ? 'Sold' : 'Available'}
                          </p>
                          {car.status === 'sold' && sale && (
                            <div className={styles.buyerInfo}>
                              <span>Buyer: <b>{sale.buyer?.full_name || 'N/A'}</b></span>
                              {sale.buyer?.email && (
                                <span style={{ marginLeft: 8, color: '#888' }}>({sale.buyer.email})</span>
                              )}
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
        </div>
      </div>
      <Footer userType="seller" />
    </div>
  );
} 