import axios from 'axios';
import { toast } from 'sonner';
import { getToken, removeToken, saveToken } from '@/lib/storage';

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

// ============== AUTHENTICATION ==============
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

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/connector/api/user/loggedin');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

// ============== PRODUCTS ==============
export const fetchProducts = async (page = 1, perPage = 50) => {
  try {
    const response = await api.get(`/connector/api/product?per_page=${perPage}&page=${page}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// ============== CONTACTS ==============
export const fetchContacts = async (page = 1, perPage = 50, type = 'customer') => {
  try {
    const response = await api.get(`/connector/api/contactapi?type=${type}&per_page=${perPage}&page=${page}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching contacts:', error);
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

// ============== SALES ==============
export interface SaleProduct {
  product_id: number;
  variation_id?: number;
  quantity: number;
  unit_price: number;
  tax_rate_id?: number | null;
  tax_amount?: number;
  discount_amount?: number;
  note?: string;
}

export interface SalePayment {
  amount: number;
  method: string;
  account_id?: number | null;
  note?: string;
}

export interface SaleData {
  location_id: number;
  contact_id?: number | null;
  customer_id?: number | null;
  transaction_date: string;
  status: string;
  is_quotation?: number;
  is_suspended?: number;
  tax_amount?: number;
  discount_amount?: number;
  sale_note?: string;
  staff_note?: string;
  shipping_details?: string | null;
  shipping_address?: string | null;
  shipping_status?: string | null;
  delivered_to?: string | null;
  shipping_charges?: number;
  products: SaleProduct[];
  payment: SalePayment[];
}

export const createSale = async (saleData: SaleData) => {
  try {
    // Ensure transaction_date is in the correct format (YYYY-MM-DD HH:MM:SS)
    if (!saleData.transaction_date) {
      saleData.transaction_date = new Date().toISOString().replace('T', ' ').substring(0, 19);
    } else if (saleData.transaction_date.includes('T')) {
      saleData.transaction_date = saleData.transaction_date.replace('T', ' ').substring(0, 19);
    }
    
    // Set default status if not provided
    if (!saleData.status) {
      saleData.status = 'final';
    }

    // Use contact_id if provided, otherwise use customer_id, fall back to null
    const contactId = saleData.contact_id || saleData.customer_id || null;
    
    // Helper function to remove null/undefined/empty values
    const removeEmptyValues = (obj: any): any => {
      const result = {} as any;
      Object.entries(obj).forEach(([key, value]) => {
        // Skip null, undefined, empty strings
        if (value === null || value === undefined || value === '') {
          return;
        }
        
        // For arrays, filter each item
        if (Array.isArray(value)) {
          const filteredArray = value.map(item => 
            typeof item === 'object' && item !== null ? removeEmptyValues(item) : item
          ).filter(item => item !== null && item !== undefined);
          
          if (filteredArray.length > 0) {
            result[key] = filteredArray;
          }
        } 
        // For objects, recurse
        else if (typeof value === 'object' && value !== null) {
          const cleaned = removeEmptyValues(value);
          if (Object.keys(cleaned).length > 0) {
            result[key] = cleaned;
          }
        } 
        // For primitive values, include directly
        else {
          result[key] = value;
        }
      });
      return result;
    };

    // Create initial request data with all required fields
    const sellData: any = {
      location_id: saleData.location_id,
      contact_id: contactId,
      transaction_date: saleData.transaction_date,
      status: saleData.status,
      payments: [],
      products: saleData.products.map(product => ({
        product_id: product.product_id,
        variation_id: product.variation_id,
        quantity: product.quantity,
        unit_price: product.unit_price,
        ...(product.tax_rate_id && { tax_rate_id: product.tax_rate_id }),
        ...(product.discount_amount && { discount_amount: product.discount_amount, discount_type: 'fixed' }),
        ...(product.note && { note: product.note })
      })),
      // Only include optional fields that have values
      ...(saleData.discount_amount && { discount_amount: saleData.discount_amount, discount_type: 'fixed' }),
      ...(saleData.tax_amount && { tax_amount: saleData.tax_amount }),
      ...(saleData.sale_note && { sale_note: saleData.sale_note }),
      ...(saleData.staff_note && { staff_note: saleData.staff_note }),
      ...(saleData.is_quotation && { is_quotation: saleData.is_quotation }),
      ...(saleData.is_suspended && { is_suspend: saleData.is_suspended }),
      ...(saleData.shipping_details && { shipping_details: saleData.shipping_details }),
      ...(saleData.shipping_address && { shipping_address: saleData.shipping_address }),
      ...(saleData.shipping_status && { shipping_status: saleData.shipping_status }),
      ...(saleData.delivered_to && { delivered_to: saleData.delivered_to }),
      ...(saleData.shipping_charges && { shipping_charges: saleData.shipping_charges })
    };

    // Add payments only if they exist
    if (saleData.payment && saleData.payment.length > 0) {
      sellData.payments = saleData.payment.map(payment => ({
        amount: payment.amount,
        method: payment.method,
        ...(payment.account_id && { account_id: payment.account_id }),
        ...(payment.note && { note: payment.note })
      }));
    }

    // Clean the data to remove any remaining null/undefined values
    const cleanedSellData = removeEmptyValues(sellData);
    
    // Wrap in sells array as required by API
    const formattedSaleData = {
      sells: [cleanedSellData]
    };
    
    // Make API request
    const response = await api.post('/connector/api/sell', formattedSaleData);
    
    if (response.data && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: 'Sale created successfully'
      };
    } else {
      return {
        success: true,
        data: response.data,
        message: 'Sale created but response format differs'
      };
    }
  } catch (error: any) {
    // Special handling for contact not found error
    if (error.response?.data?.original?.error?.message === "No query results for model [App\\Contact].") {
      return {
        success: false,
        error: "The customer ID provided doesn't exist in the system. Please use a valid customer ID or provide a default walk-in customer ID.",
        details: error.response?.data,
        isOffline: error.isOffline || false
      };
    }
    
    // Enhanced general error handling
    console.error('Error creating sale:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create sale',
      details: error.response?.data || error.message,
      isOffline: error.isOffline || false
    };
  }
};

// ============== BUSINESS LOCATION MANAGEMENT ==============
export const listBusinessLocations = async () => {
  try {
    const response = await api.get('/connector/api/business-location');
    return response.data;
  } catch (error) {
    console.error('Error listing business locations:', error);
    throw error;
  }
};

export const getBusinessLocation = async (locationId: string | number) => {
  try {
    const response = await api.get(`/connector/api/business-location/${locationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching business location:', error);
    throw error;
  }
};

// ========================================
// Business Details Management
// ========================================

export const fetchBusinessDetails = async () => {
  try {
    console.log('Fetching business details from API...');
    const response = await api.get('/connector/api/business-details');
    
    console.log('API Response status:', response.status);
    console.log('API Response data structure:', {
      hasData: !!response.data,
      hasDataProperty: !!response.data?.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      dataDataKeys: response.data?.data ? Object.keys(response.data.data) : []
    });
    
    // Check if response has the expected structure
    if (!response.data || !response.data.data) {
      console.error('Unexpected API response structure:', response.data);
      throw new Error('Invalid response structure from business details API');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching business details:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export const fetchSales = async (page = 1, perPage = 50, params = {}) => {
  try {
    const queryParams = { page, per_page: perPage, ...params };
    const response = await api.get('/connector/api/sell', { params: queryParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

export default api;
