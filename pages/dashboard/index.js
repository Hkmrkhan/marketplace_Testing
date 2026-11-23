import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import styles from '../../styles/Dashboard.module.css';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [userCars, setUserCars] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const mockUser = {
        id: 'mock-user-id',
        email: 'test@example.com',
        created_at: '2023-01-01T10:00:00.000Z',
      };
      setUser(mockUser);
      
      const mockProfile = {
        id: mockUser.id,
        user_type: 'buyer', // Can be 'seller' or 'buyer'
      };
      
      if (mockProfile.user_type === 'seller') {
          router.push('/seller-dashboard');
          return;
      } else if (mockProfile.user_type === 'buyer') {
          router.push('/buyer-dashboard');
          return;
        }
      
      const mockCars = [
        { id: 'car-1', user_id: mockUser.id, title: 'Mock Car 1', price: 10000, image_url: '/hero.webp' },
        { id: 'car-2', user_id: mockUser.id, title: 'Mock Car 2', price: 20000, image_url: '/hero.webp' },
      ];
      setUserCars(mockCars);
    };
    getUser();
  }, [router]);

  const handleLogout = async () => {
    setUser(null);
    router.push('/');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <Navbar />
      <div className={styles.dashboardContainer}>
        <aside className={styles.sidebar}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>👤</div>
            <h3>{user.email}</h3>
            <p>Member since {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
          
          <nav className={styles.sidebarNav}>
            <button 
              className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'my-cars' ? styles.active : ''}`}
              onClick={() => setActiveTab('my-cars')}
            >
              🚗 My Cars ({userCars.length})
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              👤 Profile
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Settings
            </button>
          </nav>
          
          <button className={styles.logoutBtn} onClick={handleLogout}>
            🚪 Logout
          </button>
        </aside>

        <main className={styles.mainContent}>
          {activeTab === 'overview' && (
            <div className={styles.tabContent}>
              <h2>Dashboard Overview</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>{userCars.length}</h3>
                  <p>Total Cars Listed</p>
                </div>
                <div className={styles.statCard}>
                  <h3>0</h3>
                  <p>Views This Month</p>
                </div>
                <div className={styles.statCard}>
                  <h3>0</h3>
                  <p>Messages Received</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'my-cars' && (
            <div className={styles.tabContent}>
              <h2>My Car Listings</h2>
              {userCars.length === 0 ? (
                <p>No cars listed yet. <a href="/add-car">Add your first car!</a></p>
              ) : (
                <div className={styles.carsGrid}>
                  {userCars.map(car => (
                    <div key={car.id} className={styles.carCard}>
                      <img src={car.image_url || '/hero.webp'} alt={car.title} />
                      <h3>{car.title}</h3>
                      <p>${car.price}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className={styles.tabContent}>
              <h2>Profile Settings</h2>
              <p>Profile management features coming soon...</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={styles.tabContent}>
              <h2>Account Settings</h2>
              <p>Account settings features coming soon...</p>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
