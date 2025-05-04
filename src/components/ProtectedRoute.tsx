
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const { isOnline } = useNetwork();
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      // Only check authentication if not already authenticated
      if (!isAuthenticated) {
        // If offline, we'll trust the local storage auth
        const isAuth = await checkAuth();
        if (!isAuth && !isOnline) {
          console.log('Offline mode: Using cached authentication if available');
          // In offline mode, we'll be more lenient about auth requirements
          // and check for token existence
          const token = localStorage.getItem('auth_token');
          if (token) {
            console.log('Offline mode: Found token, allowing access');
            // We have a token, so we'll allow access in offline mode
          }
        }
      }
      setChecking(false);
    };
    
    verifyAuth();
  }, [checkAuth, isAuthenticated, isOnline]);

  if (isLoading || checking) {
    // Show a spinner or loading indicator here
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sadiid-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
