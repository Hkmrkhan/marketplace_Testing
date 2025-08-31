import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Navbar.module.css';
import { supabase } from '../utils/supabaseClient';
import AIChat from './AIChat';

export default function Navbar({ logoText }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Fetch user profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
    } else {
      setUserProfile(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkUser();
    // Listen to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [checkUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setMobileMenuOpen(false);
    router.push('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="Car Marketplace Logo" className={styles.logoIcon} />
            <span className={styles.logoText}>{logoText || 'Car Marketplace'}</span>
          </div>
          
          {!loading && (
            <>
              {/* Desktop Navigation */}
              <ul className={styles.navLinks}>
                <li><Link href="/" className={`${styles.navLink} ${router.pathname === '/' ? styles.active : ''}`} onClick={closeMobileMenu}>Home</Link></li>
                {userProfile && (
                  <li><Link href="/forum" className={`${styles.navLink} ${router.pathname === '/forum' ? styles.active : ''}`} onClick={closeMobileMenu}>Forum</Link></li>
                )}
                {!userProfile && (
                  <>
                    <li>
                      {router.pathname === '/auth/login' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Login</span>
                      ) : (
                        <Link href="/auth/login" className={`${styles.navLink} ${router.pathname === '/auth/login' ? styles.active : ''}`} onClick={closeMobileMenu}>Login</Link>
                      )}
                    </li>
                    <li>
                      {router.pathname === '/auth/signup' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Sign Up</span>
                      ) : (
                        <Link href="/auth/signup" className={`${styles.navLink} ${router.pathname === '/auth/signup' ? styles.active : ''}`} onClick={closeMobileMenu}>Sign Up</Link>
                      )}
                    </li>
                  </>
                )}
                {userProfile?.user_type === 'buyer' && (
                  <>
                    <li>
                      {router.pathname === '/cars' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Cars</span>
                      ) : (
                        <Link href="/cars" className={`${styles.navLink} ${router.pathname === '/cars' ? styles.active : ''}`} onClick={closeMobileMenu}>Cars</Link>
                      )}
                    </li>
                    <li>
                      {router.pathname === '/buyer-dashboard' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Dashboard</span>
                      ) : (
                        <Link href="/buyer-dashboard" className={`${styles.navLink} ${router.pathname === '/buyer-dashboard' ? styles.active : ''}`} onClick={closeMobileMenu}>Dashboard</Link>
                      )}
                    </li>
                  </>
                )}
                {userProfile?.user_type === 'seller' && (
                  <>
                    <li>
                      {router.pathname === '/cars' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Cars</span>
                      ) : (
                        <Link href="/cars" className={`${styles.navLink} ${router.pathname === '/cars' ? styles.active : ''}`} onClick={closeMobileMenu}>Cars</Link>
                      )}
                    </li>
                    <li>
                      {router.pathname === '/add-car' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Add Car</span>
                      ) : (
                        <Link href="/add-car" className={`${styles.navLink} ${router.pathname === '/add-car' ? styles.active : ''}`} onClick={closeMobileMenu}>Add Car</Link>
                      )}
                    </li>
                    <li>
                      {router.pathname === '/seller-dashboard' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Dashboard</span>
                      ) : (
                        <Link href="/seller-dashboard" className={`${styles.navLink} ${router.pathname === '/seller-dashboard' ? styles.active : ''}`} onClick={closeMobileMenu}>Dashboard</Link>
                      )}
                    </li>
                    <li>
                      <button 
                        className={`${styles.navLink} ${styles.chatButton}`}
                        onClick={() => {
                          // This will be handled by the parent component
                          if (typeof window !== 'undefined' && window.openChatModal) {
                            window.openChatModal();
                          }
                        }}
                        title="Open Chats"
                      >
                        💬 Chats
                      </button>
                    </li>
                  </>
                )}
                {userProfile?.user_type === 'admin' && (
                  <>
                    <li>
                      {router.pathname === '/cars' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>All Cars</span>
                      ) : (
                        <Link href="/cars" className={`${styles.navLink} ${router.pathname === '/cars' ? styles.active : ''}`} onClick={closeMobileMenu}>All Cars</Link>
                      )}
                    </li>
                    <li>
                      {router.pathname === '/admin-dashboard' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Admin Dashboard</span>
                      ) : (
                        <Link href="/admin-dashboard" className={`${styles.navLink} ${router.pathname === '/admin-dashboard' ? styles.active : ''}`} onClick={closeMobileMenu}>Admin Dashboard</Link>
                      )}
                    </li>
                  </>
                )}
                {userProfile && (
                  <li><button onClick={handleLogout} className={styles.logoutBtn}>Logout</button></li>
                )}
              </ul>

              {/* Mobile Menu Button */}
              <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu}>
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </>
          )}
          
          {loading && (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
            </div>
          )}
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenuOverlay}>
            <div className={styles.mobileMenu}>
              <div className={styles.mobileMenuHeader}>
                <span className={styles.mobileMenuTitle}>Menu</span>
                <button className={styles.closeMobileMenu} onClick={closeMobileMenu}>✕</button>
              </div>
              <ul className={styles.mobileNavLinks}>
                <li><Link href="/" className={`${styles.mobileNavLink} ${router.pathname === '/' ? styles.active : ''}`} onClick={closeMobileMenu}>Home</Link></li>
                {userProfile && (
                  <li><Link href="/forum" className={`${styles.mobileNavLink} ${router.pathname === '/forum' ? styles.active : ''}`} onClick={closeMobileMenu}>Forum</Link></li>
                )}
                {!userProfile && (
                  <>
                    <li>
                      {router.pathname === '/auth/login' ? (
                        <span className={`${styles.mobileNavLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Login</span>
                      ) : (
                        <Link href="/auth/login" className={`${styles.mobileNavLink} ${router.pathname === '/auth/login' ? styles.active : ''}`} onClick={closeMobileMenu}>Login</Link>
                      )}
                    </li>
                    <li>
                      {router.pathname === '/auth/signup' ? (
                        <span className={`${styles.mobileNavLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Sign Up</span>
                      ) : (
                        <Link href="/auth/signup" className={`${styles.mobileLink} ${router.pathname === '/auth/signup' ? styles.active : ''}`} onClick={closeMobileMenu}>Sign Up</Link>
                      )}
                    </li>
                  </>
                )}
                {userProfile?.user_type === 'buyer' && (
                  <>
                    <li><Link href="/cars" className={`${styles.mobileNavLink} ${router.pathname === '/cars' ? styles.active : ''}`} onClick={closeMobileMenu}>Cars</Link></li>
                    <li><Link href="/buyer-dashboard" className={`${styles.mobileNavLink} ${router.pathname === '/buyer-dashboard' ? styles.active : ''}`} onClick={closeMobileMenu}>Dashboard</Link></li>
                  </>
                )}
                {userProfile?.user_type === 'seller' && (
                  <>
                    <li><Link href="/cars" className={`${styles.mobileNavLink} ${router.pathname === '/cars' ? styles.active : ''}`} onClick={closeMobileMenu}>Cars</Link></li>
                    <li><Link href="/add-car" className={`${styles.mobileNavLink} ${router.pathname === '/add-car' ? styles.active : ''}`} onClick={closeMobileMenu}>Add Car</Link></li>
                    <li><Link href="/seller-dashboard" className={`${styles.mobileNavLink} ${router.pathname === '/seller-dashboard' ? styles.active : ''}`} onClick={closeMobileMenu}>Dashboard</Link></li>
                    <li>
                      <button 
                        className={`${styles.mobileNavLink} ${styles.chatButton}`}
                        onClick={() => {
                          closeMobileMenu();
                          if (typeof window !== 'undefined' && window.openChatModal) {
                            window.openChatModal();
                          }
                        }}
                      >
                        💬 Chats
                      </button>
                    </li>
                  </>
                )}
                {userProfile?.user_type === 'admin' && (
                  <>
                    <li><Link href="/cars" className={`${styles.mobileNavLink} ${router.pathname === '/admin-dashboard' ? styles.active : ''}`} onClick={closeMobileMenu}>All Cars</Link></li>
                    <li><Link href="/admin-dashboard" className={`${styles.mobileNavLink} ${router.pathname === '/admin-dashboard' ? styles.active : ''}`} onClick={closeMobileMenu}>Admin Dashboard</Link></li>
                  </>
                )}
                {userProfile && (
                  <li><button onClick={handleLogout} className={styles.mobileLogoutBtn}>Logout</button></li>
                )}
              </ul>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
