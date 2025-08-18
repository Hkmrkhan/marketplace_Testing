import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Navbar.module.css';
import { supabase } from '../utils/supabaseClient';
import AIChat from './AIChat';

export default function Navbar({ logoText }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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
    router.push('/');
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
              <ul className={styles.navLinks}>
                <li><Link href="/" className={`${styles.navLink} ${router.pathname === '/' ? styles.active : ''}`}>Home</Link></li>
                {!userProfile && (
                  <>
                    <li>
                      {router.pathname === '/auth/login' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Login</span>
                      ) : (
                        <Link href="/auth/login" className={`${styles.navLink} ${router.pathname === '/auth/login' ? styles.active : ''}`}>Login</Link>
                      )}
                    </li>
                    <li>
                      {router.pathname === '/auth/signup' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Sign Up</span>
                      ) : (
                        <Link href="/auth/signup" className={`${styles.navLink} ${router.pathname === '/auth/signup' ? styles.active : ''}`}>Sign Up</Link>
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
                        <Link href="/cars" className={`${styles.navLink} ${router.pathname === '/cars' ? styles.active : ''}`}>Cars</Link>
                      )}
                    </li>
                    <li>
                      {router.pathname === '/buyer-dashboard' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Dashboard</span>
                      ) : (
                        <Link href="/buyer-dashboard" className={`${styles.navLink} ${router.pathname === '/buyer-dashboard' ? styles.active : ''}`}>Dashboard</Link>
                      )}
                    </li>
                    <li><button onClick={handleLogout} className={styles.navLink} style={{background:'none',border:'none',padding:0,margin:0,cursor:'pointer'}}>Logout</button></li>
                  </>
                )}
                {userProfile?.user_type === 'seller' && (
                  <>
                    <li>
                      {router.pathname === '/cars' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Cars</span>
                      ) : (
                        <Link href="/cars" className={`${styles.navLink} ${router.pathname === '/cars' ? styles.active : ''}`}>Cars</Link>
                      )}
                    </li>
                    <li>
                      {router.pathname === '/add-car' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Add Car</span>
                      ) : (
                        <Link href="/add-car" className={`${styles.navLink} ${router.pathname === '/add-car' ? styles.active : ''}`}>Add Car</Link>
                      )}
                    </li>
                    <li>
                      {router.pathname === '/seller-dashboard' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Dashboard</span>
                      ) : (
                        <Link href="/seller-dashboard" className={`${styles.navLink} ${router.pathname === '/seller-dashboard' ? styles.active : ''}`}>Dashboard</Link>
                      )}
                    </li>
                    <li><button onClick={handleLogout} className={styles.navLink} style={{background:'none',border:'none',padding:0,margin:0,cursor:'pointer'}}>Logout</button></li>
                  </>
                )}
                {userProfile?.user_type === 'admin' && (
                  <>
                    <li>
                      {router.pathname === '/cars' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>All Cars</span>
                      ) : (
                        <Link href="/cars" className={`${styles.navLink} ${router.pathname === '/cars' ? styles.active : ''}`}>All Cars</Link>
                      )}
                    </li>
                    <li>
                      {router.pathname === '/admin-dashboard' ? (
                        <span className={`${styles.navLink} ${styles.disabled}`} style={{cursor: 'not-allowed', opacity: 0.6}}>Admin Dashboard</span>
                      ) : (
                        <Link href="/admin-dashboard" className={`${styles.navLink} ${router.pathname === '/admin-dashboard' ? styles.active : ''}`}>Admin Dashboard</Link>
                      )}
                    </li>
                    <li><button onClick={handleLogout} className={styles.navLink} style={{background:'none',border:'none',padding:0,margin:0,cursor:'pointer'}}>Logout</button></li>
                  </>
                )}
              </ul>
            </>
          )}
          
          {loading && (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
            </div>
          )}
        </div>
      </nav>
      
      {/* Global AI Chat - floating button for all users */}
      <AIChat 
        context="general" 
        isFloating={true}
        userId={userProfile?.id}
      />
    </>
  );
}
