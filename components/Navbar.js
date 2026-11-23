import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';
import { useComparison } from '../utils/ComparisonContext';

function NavItem({ href, label, active, onClick, extraClass = '' }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        relative group px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ease-out flex items-center justify-center
        hover:-translate-y-0.5 hover:scale-[1.03] active:translate-y-0 active:scale-95
        ${active 
          ? 'text-white bg-indigo-600/30 border border-indigo-400/50 shadow-md shadow-indigo-500/25 font-semibold' 
          : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/15 hover:shadow-md hover:shadow-indigo-500/10'}
        ${extraClass}
      `}
    >
      <span className="relative z-10 transition-colors duration-200 group-hover:text-white">
        {label}
      </span>
      {/* Animated glowing bottom bar */}
      <span 
        className={`absolute bottom-1 left-3 right-3 h-[2px] rounded-full transition-all duration-300 ease-out origin-center pointer-events-none ${
          active 
            ? 'opacity-100 scale-x-100 bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 shadow-sm shadow-indigo-400/50' 
            : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400'
        }`}
      />
    </Link>
  );
}

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

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/10 shadow-2xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-indigo-600 to-violet-500 p-[1px] shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center p-1">
                <img src="/logo.webp" alt="Car Marketplace Logo" className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" />
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
                  <NavItem href="/" label="Home" active={isActive('/')} onClick={closeMobileMenu} />
                </li>

                {userProfile && (
                  <li>
                    <NavItem href="/forum" label="Forum" active={isActive('/forum')} onClick={closeMobileMenu} />
                  </li>
                )}

                {!userProfile && (
                  <>
                    <li>
                      <NavItem href="/auth/login" label="Login" active={isActive('/auth/login')} onClick={closeMobileMenu} />
                    </li>
                    <li>
                      <Link 
                        href="/auth/signup" 
                        className="relative group ml-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 shadow-md shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-200 overflow-hidden" 
                        onClick={closeMobileMenu}
                      >
                        <span className="relative z-10">Sign Up</span>
                        <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none" />
                      </Link>
                    </li>
                  </>
                )}

                {userProfile?.user_type === 'buyer' && (
                  <>
                    <li>
                      <NavItem href="/cars" label="Cars" active={isActive('/cars')} onClick={closeMobileMenu} />
                    </li>
                    <li>
                      <NavItem href="/buyer-dashboard" label="Dashboard" active={isActive('/buyer-dashboard')} onClick={closeMobileMenu} />
                    </li>
                  </>
                )}

                {userProfile?.user_type === 'seller' && (
                  <>
                    <li>
                      <NavItem href="/cars" label="Cars" active={isActive('/cars')} onClick={closeMobileMenu} />
                    </li>
                    <li>
                      <NavItem href="/add-car" label="Add Car" active={isActive('/add-car')} onClick={closeMobileMenu} />
                    </li>
                    <li>
                      <NavItem href="/seller-dashboard" label="Dashboard" active={isActive('/seller-dashboard')} onClick={closeMobileMenu} />
                    </li>
                    <li>
                      <button 
                        className="relative group px-3.5 py-2 rounded-xl text-sm font-semibold text-cyan-300 hover:text-white bg-cyan-950/30 hover:bg-gradient-to-r hover:from-cyan-600 hover:to-blue-600 border border-cyan-500/30 hover:border-cyan-400/60 shadow-sm hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                        onClick={() => {
                          if (typeof window !== 'undefined' && window.openChatModal) {
                            window.openChatModal();
                          }
                        }}
                        title="Open Chats"
                      >
                        <span className="transition-transform duration-200 group-hover:scale-110">💬</span>
                        <span>Chats</span>
                      </button>
                    </li>
                  </>
                )}

                {userProfile?.user_type === 'admin' && (
                  <>
                    <li>
                      <NavItem href="/cars" label="All Cars" active={isActive('/cars')} onClick={closeMobileMenu} />
                    </li>
                    <li>
                      <NavItem href="/admin-dashboard" label="Admin Dashboard" active={isActive('/admin-dashboard')} onClick={closeMobileMenu} />
                    </li>
                  </>
                )}

                {userProfile && (
                  <li className="ml-2">
                    <button 
                      onClick={handleLogout} 
                      className="relative group px-3.5 py-1.5 rounded-xl text-sm font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-gradient-to-r hover:from-rose-600 hover:to-pink-600 border border-rose-500/30 hover:border-rose-400/60 shadow-sm hover:shadow-lg hover:shadow-rose-600/30 hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
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
              className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-200 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-200"
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
            <div className="flex flex-col gap-2">
              <Link 
                href="/" 
                className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:translate-x-1 ${
                  isActive('/') 
                    ? 'text-white bg-indigo-600/30 border border-indigo-500/40 shadow-sm shadow-indigo-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                onClick={closeMobileMenu}
              >
                Home
              </Link>

              {userProfile && (
                <Link 
                  href="/forum" 
                  className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:translate-x-1 ${
                    isActive('/forum') 
                      ? 'text-white bg-indigo-600/30 border border-indigo-500/40 shadow-sm shadow-indigo-500/20' 
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={closeMobileMenu}
                >
                  Forum
                </Link>
              )}

              {!userProfile && (
                <>
                  <Link 
                    href="/auth/login" 
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:translate-x-1 ${
                      isActive('/auth/login') 
                        ? 'text-white bg-indigo-600/30 border border-indigo-500/40 shadow-sm shadow-indigo-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="px-4 py-3 rounded-xl text-base font-semibold text-center text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:translate-x-1 ${
                      isActive('/cars') 
                        ? 'text-white bg-indigo-600/30 border border-indigo-500/40 shadow-sm shadow-indigo-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    Cars
                  </Link>
                  <Link 
                    href="/buyer-dashboard" 
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:translate-x-1 ${
                      isActive('/buyer-dashboard') 
                        ? 'text-white bg-indigo-600/30 border border-indigo-500/40 shadow-sm shadow-indigo-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
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
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:translate-x-1 ${
                      isActive('/cars') 
                        ? 'text-white bg-indigo-600/30 border border-indigo-500/40 shadow-sm shadow-indigo-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    Cars
                  </Link>
                  <Link 
                    href="/add-car" 
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:translate-x-1 ${
                      isActive('/add-car') 
                        ? 'text-white bg-indigo-600/30 border border-indigo-500/40 shadow-sm shadow-indigo-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    Add Car
                  </Link>
                  <Link 
                    href="/seller-dashboard" 
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:translate-x-1 ${
                      isActive('/seller-dashboard') 
                        ? 'text-white bg-indigo-600/30 border border-indigo-500/40 shadow-sm shadow-indigo-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>
                  <button 
                    className="px-4 py-3 rounded-xl text-base font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 flex items-center gap-2 hover:translate-x-1 transition-all"
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
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:translate-x-1 ${
                      isActive('/cars') 
                        ? 'text-white bg-indigo-600/30 border border-indigo-500/40 shadow-sm shadow-indigo-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    All Cars
                  </Link>
                  <Link 
                    href="/admin-dashboard" 
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:translate-x-1 ${
                      isActive('/admin-dashboard') 
                        ? 'text-white bg-indigo-600/30 border border-indigo-500/40 shadow-sm shadow-indigo-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    Admin Dashboard
                  </Link>
                </>
              )}

              {userProfile && (
                <button 
                  onClick={handleLogout} 
                  className="mt-4 px-4 py-3 rounded-xl text-base font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-600 hover:text-white border border-rose-500/20 text-center transition-all duration-200 hover:scale-[1.02]"
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
