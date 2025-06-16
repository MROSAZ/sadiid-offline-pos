import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login as apiLogin, getCurrentUser } from '@/services/api';
import { getToken, removeToken, saveToken, getUser, saveUser } from '@/lib/storage';
import { queueBackgroundTask, BackgroundTasks, performWhenOnline } from '../utils/backgroundSync';

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

  const checkAuth = async () => {
    try {
      // First check local storage for token
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return false;
      }      // Then check IndexedDB for user data
      const localUser = await getUser();
      if (localUser) {
        setUser(localUser);
        setIsLoading(false);
        
        // If online, queue background refresh of user data
        if (navigator.onLine) {
          queueBackgroundUserRefresh();
        }
        
        return true;
      }

      // If no local user data, create default user profile from token
      // This allows the app to work offline even without initial user data
      const defaultUser = {
        id: token.user_id || 1,
        name: 'User',
        email: token.username || 'user@example.com',
        // Add other default fields as needed
      };
      
      setUser(defaultUser);
      await saveUser(defaultUser);
      
      // If online, queue background fetch of real user data
      if (navigator.onLine) {
        queueBackgroundUserRefresh();
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      
      // Keep user logged in if we have a token but API failed
      const localUser = await getUser();
      if (localUser) {
        setUser(localUser);
        setIsLoading(false);
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
      saveToken(tokenData);
      
      // Get user data
      const userData = await getCurrentUser();
      setUser(userData.data);
      await saveUser(userData.data);
      
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
