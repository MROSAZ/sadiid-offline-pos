
import axios from 'axios';
import { getToken } from '@/services/storage';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://erp.sadiid.net/connector/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Create a separate instance for authentication
const authApi = axios.create({
  baseURL: 'https://erp.sadiid.net',
  headers: {
    'Accept': 'application/json',
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token refresh on 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Implement token refresh here if needed
    }
    
    return Promise.reject(error);
  }
);

// Authentication with correct OAuth2 implementation
export const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('grant_type', 'password');
  formData.append('client_id', '48');
  formData.append('client_secret', 'cEM0njAX1oCo9OK4NDdwjEyWr1KKmjt6545j6zSf');
  formData.append('username', username);
  formData.append('password', password);

  try {
    const response = await authApi.post('/oauth/token', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const response = await api.get('/user/loggedin');
  return response.data;
};

// Products
export const fetchProducts = async (page = 1, perPage = 50, category_id?: number) => {
  const params = { page, per_page: perPage, category_id };
  const response = await api.get('/product', { params });
  return response.data;
};

// Contacts
export const fetchContacts = async (page = 1, perPage = 50, type?: string) => {
  const params = { page, per_page: perPage, type };
  const response = await api.get('/contactapi', { params });
  return response.data;
};

// Business details
export const fetchBusinessDetails = async () => {
  try {
    console.log('Fetching business details from API...');
    const response = await api.get('/business-details');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching business details:', error);
    throw error;
  }
};

// Sales
export const createSale = async (saleData: any) => {
  const response = await api.post('/sell', saleData);
  return response.data;
};

export const fetchSales = async (page = 1, perPage = 50, params = {}) => {
  const queryParams = { page, per_page: perPage, ...params };
  const response = await api.get('/sell', { params: queryParams });
  return response.data;
};

export default api;
