import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, getCurrentUser } from '../services/api';
import { getToken, removeToken, saveToken, getUser, saveUser } from '../services/storage';
import { toast } from 'sonner';
import { getBusinessSettings } from '../services/businessSettings';
import { syncData } from '../services/syncService';

interface User {
  id: number;
  name: string;
  email: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  checkAuth: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize data after successful login/authentication
  const initializeData = async () => {
    try {
      // 1. Check if we have business location data and select one if needed
      const settings = await getBusinessSettings(false); // Don't force refresh, use cached if available
      
      // 2. Check if we need to sync data (only if we're online)
      if (navigator.onLine) {
        const syncNeeded = await checkIfSyncNeeded();
        if (syncNeeded) {
          console.log('Initial data sync needed, starting sync...');
          await syncData();
          console.log('Initial data sync complete');
        }
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      // Don't block auth flow for data initialization errors
    }
  };

  // Determine if we need to sync data based on what's in storage
  const checkIfSyncNeeded = async () => {
    try {
      // Check local storage timestamps (we'll add these later)
      const lastSyncStr = localStorage.getItem('last_sync_timestamp');
      if (!lastSyncStr) return true;
      
      const lastSync = parseInt(lastSyncStr, 10);
      const now = Date.now();
      
      // If last sync was more than 1 hour ago, sync again
      if (now - lastSync > 3600000) return true;
      
      return false;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return true; // Default to sync if there's an error
    }
  };

  const checkAuth = async () => {
    try {
      // First check local storage for token
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return false;
      }

      // Then check IndexedDB for user data
      const localUser = await getUser();
      if (localUser) {
        setUser(localUser);
        setIsLoading(false);
        
        // Initialize data after successful authentication
        await initializeData();
        
        return true;
      }

      // Only if we don't have user data locally, try to fetch from API
      if (navigator.onLine) {
        const userData = await getCurrentUser();
        setUser(userData.data);
        await saveUser(userData.data);
        setIsLoading(false);
        
        // Initialize data after successful authentication
        await initializeData();
        
        return true;
      } else {
        // Offline and no local user data
        toast.error('You are offline and we could not find your user data');
        removeToken();
        setUser(null);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      // Keep user logged in if we have a token but API failed
      const localUser = await getUser();
      if (localUser) {
        setUser(localUser);
        setIsLoading(false);
        
        // Still try to initialize data even if API check fails
        await initializeData();
        
        return true;
      }
      
      removeToken();
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const tokenData = await apiLogin(username, password);
      
      // Save token to localStorage for quick access
      localStorage.setItem('auth_token', JSON.stringify(tokenData));
      
      // Get user data
      const userData = await getCurrentUser();
      setUser(userData.data);
      await saveUser(userData.data);
      
      // Initialize application data after successful login
      await initializeData();
      
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      let message = 'Login failed. Please check your credentials.';
      if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
      }
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
