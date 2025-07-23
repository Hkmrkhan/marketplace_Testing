import '../styles/globals.css';
import ErrorBoundary from '../components/ErrorBoundary';
import { useEffect } from 'react';
import { checkEnvironment } from '../utils/checkEnvironment';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Log environment status in development
    if (process.env.NODE_ENV === 'development') {
      const envInfo = checkEnvironment();
      console.log('🔍 Environment Status:', envInfo);
    }
  }, []);

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
} 