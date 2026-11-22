import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';
import { useComparison } from '../utils/ComparisonContext';

export default function Navbar({ logoText }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { comparisonCars } = useComparison();

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
    } else {
      setUserProfile(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkUser();
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

  const isActive = (path) => router.pathname === path;

  const linkClass = (path) => `
    px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200
    ${isActive(path) 
      ? 'text-white bg-indigo-600/30 border border-indigo-500/40 shadow-sm shadow-indigo-500/20' 
      : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'}
  `;

  const disabledLinkClass = `
    px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 border border-transparent cursor-not-allowed opacity-60
  `;

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/10 shadow-2xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px] shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center p-1">
                <img src="/logo.png" alt="Car Marketplace Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent group-hover:to-cyan-300 transition-colors">
              {logoText || 'Car Marketplace'}
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          {!loading && (
            <div className="hidden md:flex items-center gap-2">
              <ul className="flex items-center gap-1.5 list-none m-0 p-0">
                <li>
                  <Link href="/" className={linkClass('/')} onClick={closeMobileMenu}>
                    Home
                  </Link>
                </li>

                {userProfile && (
                  <li>
                    <Link href="/forum" className={linkClass('/forum')} onClick={closeMobileMenu}>
                      Forum
                    </Link>
                  </li>
                )}

                {!userProfile && (
                  <>
                    <li>
                      {isActive('/auth/login') ? (
                        <span className={disabledLinkClass}>Login</span>
                      ) : (
                        <Link href="/auth/login" className={linkClass('/auth/login')} onClick={closeMobileMenu}>
                          Login
                        </Link>
                      )}
                    </li>
                    <li>
                      {isActive('/auth/signup') ? (
                        <span className={disabledLinkClass}>Sign Up</span>
                      ) : (
                        <Link 
                          href="/auth/signup" 
                          className="ml-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all" 
                          onClick={closeMobileMenu}
                        >
                          Sign Up
                        </Link>
                      )}
                    </li>
                  </>
                )}

                {userProfile?.user_type === 'buyer' && (
                  <>
                    <li>
                      {isActive('/cars') ? (
                        <span className={disabledLinkClass}>Cars</span>
                      ) : (
                        <Link href="/cars" className={linkClass('/cars')} onClick={closeMobileMenu}>
                          Cars
                        </Link>
                      )}
                    </li>
                    <li>
                      {isActive('/buyer-dashboard') ? (
                        <span className={disabledLinkClass}>Dashboard</span>
                      ) : (
                        <Link href="/buyer-dashboard" className={linkClass('/buyer-dashboard')} onClick={closeMobileMenu}>
                          Dashboard
                        </Link>
                      )}
                    </li>
                  </>
                )}

                {userProfile?.user_type === 'seller' && (
                  <>
                    <li>
                      {isActive('/cars') ? (
                        <span className={disabledLinkClass}>Cars</span>
                      ) : (
                        <Link href="/cars" className={linkClass('/cars')} onClick={closeMobileMenu}>
                          Cars
                        </Link>
                      )}
                    </li>
                    <li>
                      {isActive('/add-car') ? (
                        <span className={disabledLinkClass}>Add Car</span>
                      ) : (
                        <Link href="/add-car" className={linkClass('/add-car')} onClick={closeMobileMenu}>
                          Add Car
                        </Link>
                      )}
                    </li>
                    <li>
                      {isActive('/seller-dashboard') ? (
                        <span className={disabledLinkClass}>Dashboard</span>
                      ) : (
                        <Link href="/seller-dashboard" className={linkClass('/seller-dashboard')} onClick={closeMobileMenu}>
                          Dashboard
                        </Link>
                      )}
                    </li>
                    <li>
                      <button 
                        className="px-3.5 py-2 rounded-xl text-sm font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 transition-all flex items-center gap-1.5"
                        onClick={() => {
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
                      {isActive('/cars') ? (
                        <span className={disabledLinkClass}>All Cars</span>
                      ) : (
                        <Link href="/cars" className={linkClass('/cars')} onClick={closeMobileMenu}>
                          All Cars
                        </Link>
                      )}
                    </li>
                    <li>
                      {isActive('/admin-dashboard') ? (
                        <span className={disabledLinkClass}>Admin Dashboard</span>
                      ) : (
                        <Link href="/admin-dashboard" className={linkClass('/admin-dashboard')} onClick={closeMobileMenu}>
                          Admin Dashboard
                        </Link>
                      )}
                    </li>
                  </>
                )}

                {userProfile && (
                  <li className="ml-2">
                    <button 
                      onClick={handleLogout} 
                      className="px-3.5 py-1.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-all"
                    >
                      Logout
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-20 z-50 bg-slate-950/95 backdrop-blur-2xl border-t border-white/10 p-6 overflow-y-auto animate-in fade-in duration-200">
            <div className="flex flex-col gap-3">
              <Link 
                href="/" 
                className={`px-4 py-3 rounded-xl text-base font-medium ${isActive('/') ? 'text-white bg-indigo-600/30 border border-indigo-500/40' : 'text-slate-300 hover:bg-white/5'}`}
                onClick={closeMobileMenu}
              >
                Home
              </Link>

              {userProfile && (
                <Link 
                  href="/forum" 
                  className={`px-4 py-3 rounded-xl text-base font-medium ${isActive('/forum') ? 'text-white bg-indigo-600/30 border border-indigo-500/40' : 'text-slate-300 hover:bg-white/5'}`}
                  onClick={closeMobileMenu}
                >
                  Forum
                </Link>
              )}

              {!userProfile && (
                <>
                  <Link 
                    href="/auth/login" 
                    className={`px-4 py-3 rounded-xl text-base font-medium ${isActive('/auth/login') ? 'text-white bg-indigo-600/30 border border-indigo-500/40' : 'text-slate-300 hover:bg-white/5'}`}
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="px-4 py-3 rounded-xl text-base font-semibold text-center text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 shadow-lg shadow-indigo-500/25"
                    onClick={closeMobileMenu}
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {userProfile?.user_type === 'buyer' && (
                <>
                  <Link 
                    href="/cars" 
                    className={`px-4 py-3 rounded-xl text-base font-medium ${isActive('/cars') ? 'text-white bg-indigo-600/30 border border-indigo-500/40' : 'text-slate-300 hover:bg-white/5'}`}
                    onClick={closeMobileMenu}
                  >
                    Cars
                  </Link>
                  <Link 
                    href="/buyer-dashboard" 
                    className={`px-4 py-3 rounded-xl text-base font-medium ${isActive('/buyer-dashboard') ? 'text-white bg-indigo-600/30 border border-indigo-500/40' : 'text-slate-300 hover:bg-white/5'}`}
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>
                </>
              )}

              {userProfile?.user_type === 'seller' && (
                <>
                  <Link 
                    href="/cars" 
                    className={`px-4 py-3 rounded-xl text-base font-medium ${isActive('/cars') ? 'text-white bg-indigo-600/30 border border-indigo-500/40' : 'text-slate-300 hover:bg-white/5'}`}
                    onClick={closeMobileMenu}
                  >
                    Cars
                  </Link>
                  <Link 
                    href="/add-car" 
                    className={`px-4 py-3 rounded-xl text-base font-medium ${isActive('/add-car') ? 'text-white bg-indigo-600/30 border border-indigo-500/40' : 'text-slate-300 hover:bg-white/5'}`}
                    onClick={closeMobileMenu}
                  >
                    Add Car
                  </Link>
                  <Link 
                    href="/seller-dashboard" 
                    className={`px-4 py-3 rounded-xl text-base font-medium ${isActive('/seller-dashboard') ? 'text-white bg-indigo-600/30 border border-indigo-500/40' : 'text-slate-300 hover:bg-white/5'}`}
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>
                  <button 
                    className="px-4 py-3 rounded-xl text-base font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-2"
                    onClick={() => {
                      closeMobileMenu();
                      if (typeof window !== 'undefined' && window.openChatModal) {
                        window.openChatModal();
                      }
                    }}
                  >
                    💬 Chats
                  </button>
                </>
              )}

              {userProfile?.user_type === 'admin' && (
                <>
                  <Link 
                    href="/cars" 
                    className={`px-4 py-3 rounded-xl text-base font-medium ${isActive('/cars') ? 'text-white bg-indigo-600/30 border border-indigo-500/40' : 'text-slate-300 hover:bg-white/5'}`}
                    onClick={closeMobileMenu}
                  >
                    All Cars
                  </Link>
                  <Link 
                    href="/admin-dashboard" 
                    className={`px-4 py-3 rounded-xl text-base font-medium ${isActive('/admin-dashboard') ? 'text-white bg-indigo-600/30 border border-indigo-500/40' : 'text-slate-300 hover:bg-white/5'}`}
                    onClick={closeMobileMenu}
                  >
                    Admin Dashboard
                  </Link>
                </>
              )}

              {userProfile && (
                <button 
                  onClick={handleLogout} 
                  className="mt-4 px-4 py-3 rounded-xl text-base font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 text-center"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
