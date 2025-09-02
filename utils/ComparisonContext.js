import React, { createContext, useContext, useState, useEffect } from 'react';

const ComparisonContext = createContext();

export function ComparisonProvider({ children }) {
  const [comparisonCars, setComparisonCars] = useState([]);
  const [showComparisonSidebar, setShowComparisonSidebar] = useState(false);

  // Load comparison cars from localStorage on mount
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/cars') {
      localStorage.removeItem('comparisonCars');
      setComparisonCars([]);
      setShowComparisonSidebar(false);
    } else {
      const saved = localStorage.getItem('comparisonCars');
      if (saved) {
        try {
          setComparisonCars(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading comparison cars:', error);
        }
      }
    }
  }, []);

  // Save to localStorage whenever comparison cars change
  useEffect(() => {
    if (comparisonCars.length > 0) {
      localStorage.setItem('comparisonCars', JSON.stringify(comparisonCars));
    } else {
      localStorage.removeItem('comparisonCars');
    }
  }, [comparisonCars]);

  // Listen for storage changes (when cleared from other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'comparisonCars') {
        if (!e.newValue) {
          setComparisonCars([]);
          setShowComparisonSidebar(false);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            setComparisonCars(parsed);
          } catch (error) {
            console.error('Error parsing comparison cars:', error);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for route changes and clear comparison on cars page
  useEffect(() => {
    const handleRouteChange = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/cars') {
        setComparisonCars([]);
        setShowComparisonSidebar(false);
        localStorage.removeItem('comparisonCars');
      }
    };
    handleRouteChange(); // Check on mount
    window.addEventListener('popstate', handleRouteChange); // Listen for back/forward
    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  const addToComparison = (car) => {
    // Check if car is already in comparison
    if (comparisonCars.some(c => c.id === car.id)) {
      return;
    }
    
    // Limit to 4 cars
    if (comparisonCars.length >= 4) {
      alert('You can compare up to 4 cars at a time. Please remove a car first.');
      return;
    }
    
    setComparisonCars(prev => [...prev, car]);
    setShowComparisonSidebar(true);
  };

  const removeFromComparison = (carId) => {
    setComparisonCars(prev => prev.filter(car => car.id !== carId));
  };

  const clearComparison = () => {
    setComparisonCars([]);
    setShowComparisonSidebar(false);
    localStorage.removeItem('comparisonCars');
  };

  const isInComparison = (carId) => {
    return comparisonCars.some(car => car.id === carId);
  };

  const resetComparison = () => {
    setComparisonCars([]);
    setShowComparisonSidebar(false);
    localStorage.removeItem('comparisonCars');
    window.location.reload(); // Force complete reset
  };

  const value = {
    comparisonCars,
    showComparisonSidebar,
    setShowComparisonSidebar,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    resetComparison
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}
