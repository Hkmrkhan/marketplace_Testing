import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';
import styles from '../styles/AdminDashboard.module.css';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [pendingCars, setPendingCars] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [soldCars, setSoldCars] = useState([]);
  const [commissionData, setCommissionData] = useState([]);
  const [allCars, setAllCars] = useState([]);
  const [availableCars, setAvailableCars] = useState([]);
  const [approvedCars, setApprovedCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
      setUser(user);

    // Check if user is admin
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
      
      if (profile?.user_type !== 'admin') {
        setMessage('❌ Only admins can access this dashboard.');
        setLoading(false);
      return;
    }

            loadPendingCars();
      loadAllUsers();
      loadSoldCars();
      loadCommissionData();
      loadAllCars();
      setLoading(false);
    };
    
    checkAuth();
  }, []);
    
  const loadPendingCars = async () => {
    try {
      // Get cars that need approval (no approval record or pending status)
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          profiles!inner(
            full_name,
            email,
            whatsapp_number
          ),
          admin_approvals(
            approval_status,
            approved_at
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading cars:', error);
        return;
      }

      // Filter cars that need approval
      const carsNeedingApproval = data.filter(car => {
        // Check if car has no approval record OR if approval_status is pending/null
        const hasApproval = car.admin_approvals && car.admin_approvals.length > 0;
        const isApproved = hasApproval && car.admin_approvals.some(approval => approval.approval_status === 'approved');
        const isRejected = hasApproval && car.admin_approvals.some(approval => approval.approval_status === 'rejected');
        
        // Car needs approval if: no approval record OR not approved OR not rejected
        return !hasApproval || (!isApproved && !isRejected);
      });

      console.log('🚗 Total cars loaded:', data.length);
      console.log('⏳ Cars needing approval:', carsNeedingApproval.length);
      
      setPendingCars(carsNeedingApproval);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      setAllUsers(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadSoldCars = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          cars!inner(
            title,
            description,
            price,
            image_url
          ),
          buyer:profiles!purchases_buyer_id_fkey(
            full_name,
            email
          ),
          seller:profiles!purchases_seller_id_fkey(
            full_name,
            email
          )
        `)
        .order('purchase_date', { ascending: false });

      if (error) {
        console.error('Error loading sold cars:', error);
        return;
      }

      setSoldCars(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadCommissionData = async () => {
    try {
      console.log('🔄 Loading enhanced commission data...');
      
      // Get enhanced commission data directly from admin_commissions table
      const { data: commissionData, error } = await supabase
        .from('admin_commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading commission data:', error);
        return;
      }

      console.log('📊 Enhanced commission data from database:', commissionData);

      // Format commission data (all data already available)
      const formattedCommissionData = commissionData.map(commission => ({
        id: commission.id,
        car_title: commission.car_title,
        car_price: commission.car_price,
        car_image_url: commission.car_image_url,
        sale_amount: commission.sale_amount,
        commission_amount: commission.commission_amount,
        buyer_name: commission.buyer_name,
        buyer_email: commission.buyer_email,
        seller_name: commission.seller_name,
        seller_email: commission.seller_email,
        sale_date: commission.sale_date,
        created_at: commission.created_at
      }));

      console.log('✅ Formatted commission data:', formattedCommissionData);
      setCommissionData(formattedCommissionData);
      
      console.log('🎯 Enhanced commission data loaded successfully!');
    } catch (error) {
      console.error('❌ Error loading commission data:', error);
    }
  };

  const loadAllCars = async () => {
    try {
      // Get all cars with seller info and approval status
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          profiles!inner(
            full_name,
            email,
            whatsapp_number
          ),
          admin_approvals(
            approval_status,
            approved_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading all cars:', error);
        return;
      }

      setAllCars(data || []);

      // Separate available and approved cars
      // Available cars: status = 'available' AND approval_status = 'approved'
      const available = data.filter(car => {
        const hasApproval = car.admin_approvals && car.admin_approvals.length > 0;
        const isApproved = hasApproval && car.admin_approvals.some(approval => approval.approval_status === 'approved');
        return car.status === 'available' && isApproved;
      });

      // Approved cars: same as available (for consistency)
      const approved = available;

      setAvailableCars(available);
      setApprovedCars(approved);
      
      console.log('🚗 Total cars loaded:', data.length);
      console.log('✅ Available (approved) cars:', available.length);
      console.log('📊 Approved cars:', approved.length);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const approveCar = async (carId) => {
    try {
      setLoading(true);
      
      // Insert approval record
      const { error: approvalError } = await supabase
        .from('admin_approvals')
        .insert([
          {
          car_id: carId,
          admin_id: user.id,
          approval_status: 'approved',
          approved_at: new Date().toISOString()
          }
        ]);

      if (approvalError) {
        console.error('Error approving car:', approvalError);
        setMessage('❌ Error approving car: ' + approvalError.message);
        return;
      }

      setMessage('✅ Car approved successfully!');

      // Reload all data to reflect changes
      await Promise.all([
        loadPendingCars(),
        loadAllCars(),
        loadCommissionData()
      ]);

    } catch (error) {
      console.error('Error:', error);
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const rejectCar = async (carId, reason) => {
    try {
      setLoading(true);
      
      // Insert rejection record
      const { error: approvalError } = await supabase
        .from('admin_approvals')
        .insert([
          {
          car_id: carId,
          admin_id: user.id,
          approval_status: 'rejected',
          approved_at: new Date().toISOString()
          }
        ]);

      if (approvalError) {
        console.error('Error rejecting car:', approvalError);
        setMessage('❌ Error rejecting car: ' + approvalError.message);
        return;
      }

      setMessage('✅ Car rejected successfully!');

      // Reload all data to reflect changes
      await Promise.all([
        loadPendingCars(),
        loadAllCars(),
        loadCommissionData()
      ]);

    } catch (error) {
      console.error('Error:', error);
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
        </div>
    );
  }

  if (!userProfile || userProfile.user_type !== 'admin') {
    return (
      <div className={styles.errorContainer}>
        <h2>Access Denied</h2>
        <p>Only admins can access this dashboard.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      
      <div className={styles.dashboardContainer}>
        <div className={styles.sidebar}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {userProfile?.full_name?.charAt(0) || 'A'}
            </div>
            <h3>{userProfile?.full_name || 'Admin'}</h3>
            <p>Administrator</p>
          </div>
          
          <nav className={styles.sidebarNav}>
            <button 
              className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'approvals' ? styles.active : ''}`}
              onClick={() => setActiveTab('approvals')}
            >
              📋 Pending Approvals ({pendingCars.length})
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'users' ? styles.active : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 All Users ({allUsers.length})
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'all-cars' ? styles.active : ''}`}
              onClick={() => setActiveTab('all-cars')}
            >
              🚗 All Cars ({allCars.length})
            </button>
            {/* Sold Cars tab removed - integrated with Commission */}
            <button 
              className={`${styles.navItem} ${activeTab === 'commission' ? styles.active : ''}`}
              onClick={() => setActiveTab('commission')}
            >
              💵 Commission ({commissionData.length})
            </button>
          </nav>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Admin Dashboard</h1>
            <p>Manage car approvals and monitor marketplace activity</p>
          </div>

          {message && (
            <div className={`${styles.message} ${message.includes('✅') ? styles.success : styles.error}`}>
              {message}
            </div>
          )}

                    {activeTab === 'overview' && (
            <div className={styles.section}>
              <h2>Dashboard Overview</h2>
              
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>🚗</div>
                  <h3>Total Cars</h3>
                  <p className={styles.statNumber}>{availableCars.length + commissionData.length}</p>
                  <small>Approved cars (available + sold)</small>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>⏳</div>
                  <h3>Pending Approval</h3>
                  <p className={styles.statNumber}>{pendingCars.length}</p>
                  <small>Awaiting admin review</small>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>✅</div>
                  <h3>Available Cars</h3>
                  <p className={styles.statNumber}>{availableCars.length}</p>
                  <small>Approved & for sale</small>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>💰</div>
                  <h3>Sold Cars</h3>
                  <p className={styles.statNumber}>{commissionData.length}</p>
                  <small>Completed sales</small>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>👥</div>
                  <h3>Total Users</h3>
                  <p className={styles.statNumber}>{allUsers.length}</p>
                  <small>Buyers & sellers</small>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>💵</div>
                  <h3>Total Commission</h3>
                  <p className={styles.statNumber}>${commissionData.reduce((total, comm) => total + parseFloat(comm.commission_amount || 0), 0).toFixed(2)}</p>
                  <small>10% on each sale</small>
                </div>
              </div>
              
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className={styles.section}>
              <h2>Pending Car Approvals ({pendingCars.length})</h2>
              
              {pendingCars.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No cars pending approval. All cars are up to date!</p>
                </div>
              ) : (
                <div className={styles.carsGrid}>
                  {pendingCars.map(car => (
                    <div key={car.id} className={styles.carCard}>
                      <div className={styles.carImage}>
                        <img src={car.image_url || '/carp2.png'} alt={car.title} />
                      </div>
                      
                      <div className={styles.carInfo}>
                        <h3>{car.title}</h3>
                        <p>{car.description}</p>
                        <p className={styles.price}>${car.price?.toLocaleString()}</p>
                        
                        <div className={styles.sellerInfo}>
                          <p><strong>Seller:</strong> {car.profiles?.full_name}</p>
                          <p><strong>Email:</strong> {car.profiles?.email}</p>
                          {car.profiles?.whatsapp_number && (
                            <p><strong>WhatsApp:</strong> {car.profiles.whatsapp_number}</p>
                          )}
                        </div>
                        
                        <div className={styles.approvalActions}>
                          <button 
                            className={styles.approveBtn}
                            onClick={() => approveCar(car.id)}
                            disabled={loading}
                          >
                            ✅ Approve
                          </button>
                          <button 
                            className={styles.rejectBtn}
                            onClick={() => rejectCar(car.id, 'Rejected by admin')}
                            disabled={loading}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className={styles.section}>
              <h2>All Users ({allUsers.length})</h2>
              
              <div className={styles.usersGrid}>
                {allUsers.map(user => (
                  <div key={user.id} className={styles.userCard}>
                    <div className={styles.userInfo}>
                      <h3>{user.full_name || 'Unknown User'}</h3>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Type:</strong> <span className={`${styles.userType} ${styles[user.user_type]}`}>{user.user_type}</span></p>
                      {user.whatsapp_number && (
                        <p><strong>WhatsApp:</strong> {user.whatsapp_number}</p>
                      )}
                      <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'all-cars' && (
            <div className={styles.section}>
              <h2>All Approved Cars ({availableCars.length + commissionData.length})</h2>
              {(availableCars.length + commissionData.length) === 0 ? (
                <div className={styles.emptyState}>
                  <p>No approved cars found in the system.</p>
                </div>
              ) : (
                <div className={styles.carsGrid}>
                  {/* Show available approved cars */}
                  {availableCars.map(car => (
                    <div key={car.id} className={styles.carCard}>
                      <div className={styles.carImage}>
                        <img src={car.image_url || '/carp2.png'} alt={car.title} />
                      </div>
                      <div className={styles.carInfo}>
                        <h3>{car.title}</h3>
                        <p>{car.description}</p>
                        <p className={styles.price}>${car.price?.toLocaleString()}</p>
                        <div className={styles.carStatus}>
                          <span className={`${styles.statusBadge} ${styles[car.status]}`}>{car.status}</span>
                          <span className={styles.sellerName}>by {car.profiles?.full_name}</span>
                        </div>
                        {car.admin_approvals && car.admin_approvals.length > 0 && (
                          <div className={styles.approvalStatus}>
                            <span className={`${styles.statusBadge} ${styles[car.admin_approvals[0].approval_status]}`}>
                              {car.admin_approvals[0].approval_status}
                            </span>
                            <small>Approved at: {car.admin_approvals[0].approved_at ? new Date(car.admin_approvals[0].approved_at).toLocaleDateString() : 'N/A'}</small>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Show sold cars */}
                  {commissionData.map(commission => (
                    <div key={commission.id} className={styles.carCard}>
                      <div className={styles.carImage}>
                        <img src={commission.car_image_url || '/carp2.png'} alt={commission.car_title} />
                      </div>
                      <div className={styles.carInfo}>
                        <h3>{commission.car_title}</h3>
                        <p>Sold car - {commission.car_description || 'No description available'}</p>
                        <p className={styles.price}>${commission.sale_amount?.toLocaleString()}</p>
                        <div className={styles.carStatus}>
                          <span className={`${styles.statusBadge} ${styles.sold}`}>sold</span>
                          <span className={styles.sellerName}>by {commission.seller_name}</span>
                        </div>
                        <div className={styles.approvalStatus}>
                          <span className={`${styles.statusBadge} ${styles.approved}`}>
                            approved
                          </span>
                          <small>Sold at: {commission.sale_date ? new Date(commission.sale_date).toLocaleDateString() : 'N/A'}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sold Cars section removed - now integrated with Commission tab */}

          {activeTab === 'commission' && (
            <div className={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Commission Report (10% on each sale)</h2>
                <button 
                  onClick={loadCommissionData}
                  className={styles.refreshBtn}
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#218838';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#28a745';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
                  🔄 Refresh Data
                </button>
              </div>
              
              {commissionData.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No commission data available. No cars have been sold yet.</p>
                  <p><strong>Debug Info:</strong> Commission records: {commissionData.length}</p>
                  <button 
                    onClick={loadCommissionData}
                    style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
                  >
                    🔄 Force Refresh
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.commissionSummary}>
                    <h3>💰 Commission Summary</h3>
                    <div className={styles.summaryGrid}>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryIcon}>📊</span>
                        <div className={styles.summaryContent}>
                          <span className={styles.summaryLabel}>Total Sales</span>
                          <span className={styles.summaryValue}>{commissionData.length}</span>
                        </div>
                      </div>
                      
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryIcon}>💵</span>
                        <div className={styles.summaryContent}>
                          <span className={styles.summaryLabel}>Total Commission</span>
                          <span className={styles.summaryValue}>${commissionData.reduce((total, comm) => total + parseFloat(comm.commission_amount || 0), 0).toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryIcon}>📈</span>
                        <div className={styles.summaryContent}>
                          <span className={styles.summaryLabel}>Commission Rate</span>
                          <span className={styles.summaryValue}>10%</span>
                        </div>
                      </div>
                      
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryIcon}>🔄</span>
                        <div className={styles.summaryContent}>
                          <span className={styles.summaryLabel}>Last Updated</span>
                          <span className={styles.summaryValue}>{new Date().toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      className={styles.refreshBtn}
                      onClick={loadCommissionData}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                        transition: 'all 0.3s ease',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                      }}
                    >
                      🔄 Refresh Data
                    </button>
                  </div>
                  
                  <div className={styles.commissionGrid}>
                    {commissionData.map(commission => (
                      <div key={commission.id} className={styles.commissionCard}>
                        <div className={styles.carImage}>
                          <img 
                            src={commission.car_image_url || '/carp2.png'} 
                            alt={commission.car_title}
                            onError={(e) => {
                              e.target.src = '/carp2.png';
                            }}
                          />
                        </div>
                        
                        <div className={styles.commissionInfo}>
                          <h3 className={styles.carTitle}>{commission.car_title}</h3>
                          
                          <div className={styles.priceSection}>
                            <div className={styles.priceRow}>
                              <span className={styles.priceLabel}>🚗 Car Price:</span>
                              <span className={styles.priceValue}>${commission.car_price?.toLocaleString()}</span>
                            </div>
                            <div className={styles.priceRow}>
                              <span className={styles.priceLabel}>💰 Sale Amount:</span>
                              <span className={styles.priceValue}>${commission.sale_amount?.toLocaleString()}</span>
                            </div>
                            <div className={styles.priceRow}>
                              <span className={styles.priceLabel}>💵 Commission (10%):</span>
                              <span className={styles.priceValue}>${commission.commission_amount}</span>
                            </div>
                          </div>
                          
                          <div className={styles.userSection}>
                            <div className={styles.userRow}>
                              <span className={styles.userLabel}>👤 Buyer:</span>
                              <span className={styles.userValue}>{commission.buyer_name}</span>
                            </div>
                            <div className={styles.userRow}>
                              <span className={styles.userLabel}>📧 Buyer Email:</span>
                              <span className={styles.userValue}>{commission.buyer_email}</span>
                            </div>
                            <div className={styles.userRow}>
                              <span className={styles.userLabel}>🏪 Seller:</span>
                              <span className={styles.userValue}>{commission.seller_name}</span>
                            </div>
                            <div className={styles.userRow}>
                              <span className={styles.userLabel}>📧 Seller Email:</span>
                              <span className={styles.userValue}>{commission.seller_email}</span>
                            </div>
                          </div>
                          
                          <div className={styles.dateSection}>
                            <div className={styles.dateRow}>
                              <span className={styles.dateLabel}>📅 Sale Date:</span>
                              <span className={styles.dateValue}>
                                {commission.sale_date ? new Date(commission.sale_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'N/A'}
                              </span>
                            </div>
                            <div className={styles.dateRow}>
                              <span className={styles.dateLabel}>⏰ Commission Created:</span>
                              <span className={styles.dateValue}>
                                {commission.created_at ? new Date(commission.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
              </div>
            </div>
      
      <Footer />
    </div>
  );
} 