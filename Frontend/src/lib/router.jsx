import React, { createContext, useContext, useState, useEffect } from 'react';

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [path, setPath] = useState(window.location.pathname || '/dashboard');

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newPath) => {
    if (newPath !== path) {
      window.history.pushState({}, '', newPath);
      setPath(newPath);
      window.scrollTo(0, 0);
    }
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

/**
 * Matches route pattern (e.g., /requests/:id) against current path
 */
export function matchRoute(pattern, currentPath) {
  const patternParts = pattern.split('/').filter(Boolean);
  const currentParts = currentPath.split('/').filter(Boolean);

  if (patternParts.length !== currentParts.length) {
    return null;
  }

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      const paramName = patternParts[i].slice(1);
      params[paramName] = currentParts[i];
    } else if (patternParts[i] !== currentParts[i]) {
      return null;
    }
  }

  return params;
}
