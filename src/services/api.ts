
import axios from 'axios';
import { toast } from 'sonner';
import { getToken, removeToken, saveToken } from './storage';

const BASE_URL = 'https://erp.sadiid.net';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // If the token is expired, remove it
      removeToken();
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
    }
    
    if (!navigator.onLine) {
      toast.error('No internet connection. Working in offline mode.');
      return Promise.reject({ isOffline: true, ...error });
    }
    
    return Promise.reject(error);
  }
);

export const login = async (username: string, password: string) => {
  try {
    const formData = new FormData();
    formData.append('grant_type', 'password');
    formData.append('client_id', '48');
    formData.append('client_secret', 'cEM0njAX1oCo9OK4NDdwjEyWr1KKmjt6545j6zSf');
    formData.append('username', username);
    formData.append('password', password);

    const response = await axios.post(`${BASE_URL}/oauth/token`, formData);
    saveToken(response.data);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const fetchProducts = async (page = 1, perPage = 50) => {
  try {
    const response = await api.get(`/connector/api/product?per_page=${perPage}&page=${page}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const fetchContacts = async (page = 1, perPage = 50, type = 'customer') => {
  try {
    const response = await api.get(`/connector/api/contactapi?type=${type}&per_page=${perPage}&page=${page}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};

export const createSale = async (saleData: any) => {
  try {
    const response = await api.post('/connector/api/sell', saleData);
    return response.data;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

export const createContact = async (contactData: any) => {
  try {
    const response = await api.post('/connector/api/contactapi', contactData);
    return response.data;
  } catch (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/connector/api/user/loggedin');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

export default api;
