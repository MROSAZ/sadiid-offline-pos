
import axios from 'axios';
import { getToken } from './storage';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://erp.sadiid.net/connector/api',
  headers: {
    'Content-Type': 'application/json',
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

// Authentication
export const login = async (username: string, password: string) => {
  const response = await api.post('/login', { username, password });
  return response.data;
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

// For testing network connectivity
export const pingServer = async () => {
  try {
    const response = await api.get('/get-attendance/1', { 
      timeout: 5000,
      headers: { 'Cache-Control': 'no-cache' }
    });
    return response.status === 200;
  } catch (error) {
    console.error('Ping failed:', error);
    return false;
  }
};

// Add more API functions as needed

export default api;
