import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login as apiLogin, getCurrentUser } from '@/services/api';
import { getToken, removeToken, saveToken, getUser, saveUser } from '@/lib/storage';
import { queueBackgroundTask, BackgroundTasks, performWhenOnline } from '../utils/backgroundSync';
import { startBackgroundSync } from '@/services/syncService';
import { autoSelectLocation } from '@/services/locationService';
import { User } from '@/types/api';

/**
 * Queue a background refresh of user data without blocking the UI
 */
const queueBackgroundUserRefresh = async (): Promise<void> => {
  const refreshTask = performWhenOnline(async () => {
    console.log('Performing background user refresh...');
    const userData = await getCurrentUser();
    
    if (userData && userData.data) {
      await saveUser(userData.data);
      console.log('Background user refresh completed');
    }
  });

  queueBackgroundTask(BackgroundTasks.USER_REFRESH, refreshTask, 200);
};

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

  const checkAuth = async () => {
    try {
      console.log('🔍 CheckAuth: Starting authentication check...');
      
      // First check local storage for token
      const token = getToken();
      console.log('🔑 CheckAuth: Token found:', !!token);
      
      if (!token) {
        console.log('❌ CheckAuth: No token found, setting not authenticated');
        setIsLoading(false);
        return false;
      }

      // Then check IndexedDB for user data
      const localUser = await getUser();
      console.log('👤 CheckAuth: Local user found:', !!localUser);
      
      if (localUser) {
        console.log('✅ CheckAuth: Setting user and authenticated state');
        // Ensure the user object has a computed name field
        const userWithName = {
          ...localUser,
          name: localUser.name || `${localUser.first_name} ${localUser.last_name}`.trim() || localUser.username
        };
        setUser(userWithName);
        setIsLoading(false);
        
        // If online, queue background refresh of user data
        if (navigator.onLine) {
          console.log('🌐 CheckAuth: Online, queueing background user refresh');
          queueBackgroundUserRefresh();
        }
        
        return true;
      }

      // If no local user data, create default user profile from token
      // This allows the app to work offline even without initial user data
      console.log('⚠️ CheckAuth: No local user data, creating default user profile');
      const defaultUser: User = {
        id: token.user_id || 1,
        username: token.username || 'user',
        email: token.username || 'user@example.com',
        first_name: 'User',
        last_name: '',
        name: 'User', // Add computed name
        business_id: token.business_id || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      };
      
      console.log('💾 CheckAuth: Saving default user profile');
      setUser(defaultUser);
      await saveUser(defaultUser);
      
      // If online, queue background fetch of real user data
      if (navigator.onLine) {
        console.log('🌐 CheckAuth: Online, queueing background fetch of real user data');
        queueBackgroundUserRefresh();
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('❌ CheckAuth: Authentication check failed:', error);
      
      // Keep user logged in if we have a token but API failed
      const localUser = await getUser();
      console.log('🔄 CheckAuth: API failed, checking local user backup:', !!localUser);
      
      if (localUser) {
        console.log('✅ CheckAuth: Using local user backup');
        setUser(localUser);
        setIsLoading(false);
        return true;
      }
      
      console.log('❌ CheckAuth: No local user backup, clearing auth');
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
      console.log('🔐 Login: Starting login process for:', username);
      setIsLoading(true);
      
      const tokenData = await apiLogin(username, password);
      console.log('🔑 Login: Token received:', !!tokenData);
      
      // Save token to localStorage for quick access
      await saveToken(tokenData);
      console.log('💾 Login: Token saved to storage');
      
      // Get user data
      console.log('👤 Login: Fetching user data...');
      const userData = await getCurrentUser();
      console.log('📋 Login: User data received:', !!userData?.data);
      
      // Create compatible user object with computed name
      const userWithName = {
        ...userData.data,
        name: `${userData.data.first_name} ${userData.data.last_name}`.trim() || userData.data.username
      };
      
      setUser(userWithName);
      await saveUser(userWithName);
      console.log('💾 Login: User data saved to storage');
      
      // Start background sync and auto-select location
      console.log('🔄 Login: Starting background sync...');
      startBackgroundSync();
      await autoSelectLocation();
      console.log('📍 Login: Location auto-selected');
      
      toast.success('Login successful');
      console.log('✅ Login: Complete, navigating to dashboard');
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
