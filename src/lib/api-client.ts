/**
 * API Client for Sadiid ERP Integration
 * 
 * This client provides a type-safe interface to the Sadiid ERP API
 * with built-in request validation, retry logic, and offline support.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  ApiError, 
  AuthTokenResponse, 
  LoginRequest, 
  User, 
  Product, 
  Transaction, 
  Contact,
  Business,
  BusinessLocation
} from '../types/api';

// API Configuration
const API_CONFIG = {
  BASE_URL: 'https://erp.sadiid.net',
  CONNECTOR_PATH: '/connector/api',
  OAUTH_PATH: '/oauth',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Request/Response Interceptor Types
interface RequestInterceptor {
  onFulfilled?: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>;
  onRejected?: (error: any) => any;
}

interface ResponseInterceptor {
  onFulfilled?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
  onRejected?: (error: any) => any;
}

/**
 * Main API Client Class
 */
export class SadiidApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private retryQueue: Array<() => Promise<any>> = [];
  private isRefreshing = false;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
    this.loadTokensFromStorage();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If refresh is in progress, queue the request
            return new Promise((resolve, reject) => {
              this.retryQueue.push(async () => {
                originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
                return resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            if (this.refreshToken) {
              await this.refreshAccessToken();
              
              // Retry all queued requests
              this.retryQueue.forEach(callback => callback());
              this.retryQueue = [];
              
              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens but don't redirect
            // Let the app handle the redirect through AuthContext
            this.clearTokens();
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Format API errors consistently
   */
  private formatError(error: any): ApiError {
    if (error.response) {
      return {
        error: error.response.data?.error || 'API Error',
        message: error.response.data?.message || error.message,
        status_code: error.response.status
      };
    } else if (error.request) {
      return {
        error: 'Network Error',
        message: 'No response received from server',
        status_code: 0
      };
    } else {
      return {
        error: 'Request Error',
        message: error.message,
        status_code: 0
      };
    }
  }

  /**
   * Load tokens from localStorage
   */
  private loadTokensFromStorage(): void {
    try {
      // Use the same token storage as the rest of the app
      const authTokenString = localStorage.getItem('auth_token');
      if (authTokenString) {
        const authToken = JSON.parse(authTokenString);
        this.accessToken = authToken.access_token;
        this.refreshToken = authToken.refresh_token;
      }
    } catch (error) {
      console.warn('Failed to load tokens from storage:', error);
    }
  }

  /**
   * Save tokens to localStorage
   */
  private saveTokensToStorage(): void {
    try {
      if (this.accessToken) {
        const tokenData = {
          access_token: this.accessToken,
          refresh_token: this.refreshToken,
          token_type: 'Bearer'
        };
        localStorage.setItem('auth_token', JSON.stringify(tokenData));
      }
    } catch (error) {
      console.warn('Failed to save tokens to storage:', error);
    }
  }

  /**
   * Clear tokens from memory and storage
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    try {
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.warn('Failed to clear tokens from storage:', error);
    }
  }

  // Authentication Methods

  /**
   * Login with username and password
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthTokenResponse>> {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('client_id', import.meta.env.VITE_OAUTH_CLIENT_ID || '48');
    formData.append('client_secret', import.meta.env.VITE_OAUTH_CLIENT_SECRET || 'cEM0njAX1oCo9OK4NDdwjEyWr1KKmjt6545j6zSf');
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    formData.append('scope', '*');

    const response = await this.client.post<AuthTokenResponse>(
      `${API_CONFIG.OAUTH_PATH}/token`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Store tokens
    this.accessToken = response.data.access_token;
    this.refreshToken = response.data.refresh_token || null;
    this.saveTokensToStorage();

    return {
      data: response.data,
      success: true
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('refresh_token', this.refreshToken);
    formData.append('client_id', import.meta.env.VITE_OAUTH_CLIENT_ID || '48');
    formData.append('client_secret', import.meta.env.VITE_OAUTH_CLIENT_SECRET || 'cEM0njAX1oCo9OK4NDdwjEyWr1KKmjt6545j6zSf');

    const response = await this.client.post<AuthTokenResponse>(
      `${API_CONFIG.OAUTH_PATH}/token`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    this.accessToken = response.data.access_token;
    if (response.data.refresh_token) {
      this.refreshToken = response.data.refresh_token;
    }
    this.saveTokensToStorage();
  }

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<void> {
    try {
      if (this.accessToken) {
        await this.client.post(`${API_CONFIG.OAUTH_PATH}/revoke`, {
          token: this.accessToken
        });
      }
    } catch (error) {
      console.warn('Failed to revoke token on server:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Business Methods

  /**
   * Get business details
   */
  async getBusinessDetails(): Promise<ApiResponse<Business>> {
    const response = await this.client.get<ApiResponse<Business>>(
      `${API_CONFIG.CONNECTOR_PATH}/business-details`
    );
    return response.data;
  }

  /**
   * Get business locations
   */
  async getBusinessLocations(): Promise<ApiResponse<BusinessLocation[]>> {
    const response = await this.client.get<ApiResponse<BusinessLocation[]>>(
      `${API_CONFIG.CONNECTOR_PATH}/business-location`
    );
    return response.data;
  }

  // User Methods

  /**
   * Get current user details
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.client.get<ApiResponse<User>>(
      `${API_CONFIG.CONNECTOR_PATH}/user/loggedin`
    );
    return response.data;
  }

  /**
   * Get all users
   */
  async getUsers(): Promise<ApiResponse<User[]>> {
    const response = await this.client.get<ApiResponse<User[]>>(
      `${API_CONFIG.CONNECTOR_PATH}/user`
    );
    return response.data;
  }

  // Product Methods

  /**
   * Get all products
   */
  async getProducts(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category_id?: number;
  }): Promise<ApiResponse<Product[]>> {
    const response = await this.client.get<ApiResponse<Product[]>>(
      `${API_CONFIG.CONNECTOR_PATH}/product`,
      { params }
    );
    return response.data;
  }

  /**
   * Get product by ID
   */
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    const response = await this.client.get<ApiResponse<Product>>(
      `${API_CONFIG.CONNECTOR_PATH}/product/${id}`
    );
    return response.data;
  }

  /**
   * Create new product
   */
  async createProduct(productData: FormData): Promise<ApiResponse<Product>> {
    const response = await this.client.post<ApiResponse<Product>>(
      `${API_CONFIG.CONNECTOR_PATH}/new_product`,
      productData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  /**
   * Update product
   */
  async updateProduct(id: number, productData: FormData): Promise<ApiResponse<Product>> {
    const response = await this.client.post<ApiResponse<Product>>(
      `${API_CONFIG.CONNECTOR_PATH}/product/${id}`,
      productData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  // Transaction Methods

  /**
   * Get all transactions
   */
  async getTransactions(params?: {
    page?: number;
    per_page?: number;
    start_date?: string;
    end_date?: string;
    contact_id?: number;
    location_id?: number;
  }): Promise<ApiResponse<Transaction[]>> {
    const response = await this.client.get<ApiResponse<Transaction[]>>(
      `${API_CONFIG.CONNECTOR_PATH}/sell`,
      { params }
    );
    return response.data;
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(id: number): Promise<ApiResponse<Transaction>> {
    const response = await this.client.get<ApiResponse<Transaction>>(
      `${API_CONFIG.CONNECTOR_PATH}/sell/${id}`
    );
    return response.data;
  }

  /**
   * Create new transaction
   */
  async createTransaction(transactionData: any): Promise<ApiResponse<Transaction>> {
    const response = await this.client.post<ApiResponse<Transaction>>(
      `${API_CONFIG.CONNECTOR_PATH}/new_sell`,
      transactionData
    );
    return response.data;
  }

  /**
   * Update transaction
   */
  async updateTransaction(id: number, transactionData: any): Promise<ApiResponse<Transaction>> {
    const response = await this.client.put<ApiResponse<Transaction>>(
      `${API_CONFIG.CONNECTOR_PATH}/sell/${id}`,
      transactionData
    );
    return response.data;
  }

  // Contact Methods

  /**
   * Get all contacts
   */
  async getContacts(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    type?: 'customer' | 'supplier' | 'both';
  }): Promise<ApiResponse<Contact[]>> {
    const response = await this.client.get<ApiResponse<Contact[]>>(
      `${API_CONFIG.CONNECTOR_PATH}/contactapi`,
      { params }
    );
    return response.data;
  }

  /**
   * Get contact by ID
   */
  async getContact(id: number): Promise<ApiResponse<Contact>> {
    const response = await this.client.get<ApiResponse<Contact>>(
      `${API_CONFIG.CONNECTOR_PATH}/contactapi/${id}`
    );
    return response.data;
  }

  /**
   * Create new contact
   */
  async createContact(contactData: any): Promise<ApiResponse<Contact>> {
    const response = await this.client.post<ApiResponse<Contact>>(
      `${API_CONFIG.CONNECTOR_PATH}/new_contactapi`,
      contactData
    );
    return response.data;
  }

  /**
   * Update contact
   */
  async updateContact(id: number, contactData: any): Promise<ApiResponse<Contact>> {
    const response = await this.client.put<ApiResponse<Contact>>(
      `${API_CONFIG.CONNECTOR_PATH}/contactapi/${id}`,
      contactData
    );
    return response.data;
  }

  // Utility Methods

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(
      endpoint.startsWith('/') ? endpoint : `${API_CONFIG.CONNECTOR_PATH}/${endpoint}`,
      { params }
    );
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(
      endpoint.startsWith('/') ? endpoint : `${API_CONFIG.CONNECTOR_PATH}/${endpoint}`,
      data,
      config
    );
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(
      endpoint.startsWith('/') ? endpoint : `${API_CONFIG.CONNECTOR_PATH}/${endpoint}`,
      data,
      config
    );
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(
      endpoint.startsWith('/') ? endpoint : `${API_CONFIG.CONNECTOR_PATH}/${endpoint}`,
      config
    );
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get(`${API_CONFIG.CONNECTOR_PATH}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new SadiidApiClient();

// Export individual API modules for better organization
export * from './modules/auth';
export * from './modules/products';
export * from './modules/transactions';
export * from './modules/contacts';
export * from './modules/business';

// Re-export types
export * from '../types/api';
