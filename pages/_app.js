import '../styles/globals.css';
import ErrorBoundary from '../components/ErrorBoundary';
import AIChat from '../components/AIChat';
import ComparisonSidebar from '../components/ComparisonSidebar';
import { ComparisonProvider } from '../utils/ComparisonContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { checkEnvironment } from '../utils/checkEnvironment';
import { supabase } from '../utils/supabaseClient';

export default function App({ Component, pageProps }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthPage, setIsAuthPage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Log environment status in development
    if (process.env.NODE_ENV === 'development') {
      const envInfo = checkEnvironment();
      console.log('🔍 Environment Status:', envInfo);
    }

    // Check if current page is an auth page
    const checkAuthPage = () => {
      const path = router.pathname;
      const authPaths = [
        '/auth/login',
        '/auth/signup', 
        '/auth/reset-password',
        '/auth/forgot-password',
        '/auth/verify-email',
        '/login',
        '/signup',
        '/reset-password',
        '/forgot-password',
        '/verify-email'
      ];
      
      const isAuth = authPaths.some(authPath => path.startsWith(authPath) || path.includes('auth'));
      setIsAuthPage(isAuth);
      
      console.log('🔍 Route check:', { path, isAuth, showAI: !isAuth });
    };

    // Initial check
    checkAuthPage();

    // Listen for route changes
    router.events.on('routeChangeComplete', checkAuthPage);

    // Get user profile for AI chatbot
    const getUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          setUserProfile(profile);
        }
      } catch (error) {
        console.log('No user logged in');
      } finally {
        setLoading(false);
      }
    };

    getUserProfile();

    // Cleanup
    return () => {
      router.events.off('routeChangeComplete', checkAuthPage);
    };
  }, [router]);

  return (
    <ErrorBoundary>
      <ComparisonProvider>
        <Component {...pageProps} />
        
        {/* Global AI Chat Assistant - Hidden on auth pages */}
        {!loading && !isAuthPage && (
          <AIChat 
            context="global" 
            isFloating={true}
            userId={userProfile?.id}
          />
        )}
        
        {/* Global Comparison Sidebar */}
        <ComparisonSidebar />
      </ComparisonProvider>
    </ErrorBoundary>
  );
} 