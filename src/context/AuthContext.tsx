
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, getCurrentUser } from '../services/api';
import { getToken, removeToken, saveToken, saveUser } from '../services/storage';
import { toast } from 'sonner';

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
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return false;
      }

      // Try to get current user
      const userData = await getCurrentUser();
      setUser(userData.data);
      await saveUser(userData.data);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
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
