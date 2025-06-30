import axios from 'axios';
import { toast } from 'sonner';
import { getToken, removeToken, saveToken } from '@/lib/storage';

// Import new OpenAPI-driven API client and modules
import { apiClient } from '@/lib/api-client';
import { AuthApi } from '@/lib/modules/auth';
import { ProductsApi } from '@/lib/modules/products';
import { TransactionsApi } from '@/lib/modules/transactions';
import { ContactsApi } from '@/lib/modules/contacts';
import { BusinessApi } from '@/lib/modules/business';

// Import types for better type safety
import type { 
  LoginRequest, 
  Product, 
  Contact, 
  Transaction, 
  Business,
  PaginatedResponse,
  ApiResponse,
  TransactionCreateRequest,
  ContactCreateRequest,
  AuthTokenResponse
} from '@/types/api';

// Re-export API modules for easier access throughout the app
export { apiClient };

const BASE_URL = 'https://erp.sadiid.net';

// Legacy axios instance for backward compatibility during migration
const legacyApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Request interceptor for API calls
legacyApi.interceptors.request.use(
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
legacyApi.interceptors.response.use(
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

// ============== NEW OPENAPI-DRIVEN API MODULES ==============
// Import static API classes - these don't need to be instantiated
export { AuthApi, ProductsApi, TransactionsApi, ContactsApi, BusinessApi };

// ============== REFACTORED AUTHENTICATION (Using new AuthApi) ==============
export const login = async (username: string, password: string) => {
  try {
    // Use new type-safe auth API
    const response = await AuthApi.login({
      username,
      password
    });
    
    // Save just the token data, not the entire response
    saveToken(response.data);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    // Use new type-safe auth API
    const response = await AuthApi.getCurrentUser();
    return response;
  } catch (error) {
    console.error('Error fetching current user:', error);
    // Fallback to legacy API for backward compatibility
    try {
      const fallbackResponse = await legacyApi.get('/connector/api/user/loggedin');
      return fallbackResponse.data;
    } catch (fallbackError) {
      throw error;
    }
  }
};

// ============== REFACTORED PRODUCTS (Using new ProductsApi) ==============
export const fetchProducts = async (page = 1, perPage = 500) => {
  try {
    // Use new type-safe products API
    const response = await ProductsApi.getProducts({
      page: page,
      per_page: perPage
    });
    
    // If page > 1, just return that specific page
    if (page > 1) {
      return response.data;
    }
    
    // If page = 1, fetch all products across all pages for backward compatibility
    let allProducts = response.data?.data || [];
    let currentPage = 2;
    const totalPages = response.data?.last_page || 1;
    
    // Fetch remaining pages if needed
    while (currentPage <= totalPages) {
      try {
        const pageResponse = await ProductsApi.getProducts({
          page: currentPage,
          per_page: perPage
        });
        
        if (pageResponse.data?.data && pageResponse.data.data.length > 0) {
          allProducts = [...allProducts, ...pageResponse.data.data];
        }
        
        currentPage++;
      } catch (pageError) {
        console.warn(`Failed to fetch page ${currentPage}:`, pageError);
        break;
      }
    }
    
    return {
      data: allProducts,
      total: response.data?.total || 0,
      current_page: 1,
      per_page: allProducts.length,
      last_page: 1,
      from: 1,
      to: allProducts.length
    };
    
  } catch (error) {
    console.error('Error fetching products:', error);
    // Fallback to legacy API for backward compatibility
    return fetchProductsLegacy(page, perPage);
  }
};

// Legacy fallback for products
const fetchProductsLegacy = async (page = 1, perPage = 500) => {
  try {
    let allProducts = [];
    let currentPage = page;
    let hasMorePages = true;
    let totalCount = 0;
    let lastPageInfo = null;

    // If page > 1, just fetch that specific page (for backward compatibility)
    if (page > 1) {
      const response = await legacyApi.get(`/connector/api/product?per_page=${perPage}&page=${page}`);
      return response.data;
    }

    // If page = 1, fetch all products across all pages
    while (hasMorePages) {
      const response = await legacyApi.get(`/connector/api/product?per_page=${perPage}&page=${currentPage}`);
      const responseData = response.data;

      if (responseData.data && responseData.data.length > 0) {
        allProducts = [...allProducts, ...responseData.data];
        
        // Store pagination info from first page
        if (currentPage === 1) {
          totalCount = responseData.total || 0;
          lastPageInfo = {
            current_page: responseData.current_page,
            per_page: responseData.per_page,
            total: responseData.total,
            last_page: responseData.last_page,
            from: responseData.from,
            to: responseData.to
          };
        }
        
        // Check if we got fewer products than requested (last page)
        if (responseData.data.length < perPage || 
            (responseData.last_page && currentPage >= responseData.last_page)) {
          hasMorePages = false;
        } else {
          currentPage++;
        }
      } else {
        hasMorePages = false;
      }
    }

    // Return in the same format as the original API response
    return {
      data: allProducts,
      total: totalCount,
      current_page: 1,
      per_page: allProducts.length,
      last_page: 1,
      from: 1,
      to: allProducts.length,
      ...lastPageInfo
    };

  } catch (error) {
    console.error('Error fetching products (legacy):', error);
    throw error;
  }
};

// ============== REFACTORED CONTACTS (Using new ContactsApi) ==============
export const fetchContacts = async (page = 1, perPage = 500, type: 'customer' | 'supplier' | 'both' = 'customer') => {
  try {
    // Use new type-safe contacts API
    const response = await ContactsApi.getContacts({
      type,
      page: page, 
      per_page: perPage
    });
    
    // If page > 1, just return that specific page
    if (page > 1) {
      return response.data;
    }
    
    // If page = 1, fetch all contacts across all pages for backward compatibility
    let allContacts = response.data?.data || [];
    let currentPage = 2;
    const totalPages = response.data?.last_page || 1;
    
    // Fetch remaining pages if needed
    while (currentPage <= totalPages) {
      try {
        const pageResponse = await ContactsApi.getContacts({
          type,
          page: currentPage,
          per_page: perPage
        });
        
        if (pageResponse.data?.data && pageResponse.data.data.length > 0) {
          allContacts = [...allContacts, ...pageResponse.data.data];
        }
        
        currentPage++;
      } catch (pageError) {
        console.warn(`Failed to fetch contacts page ${currentPage}:`, pageError);
        break;
      }
    }
    
    return {
      data: allContacts,
      total: response.data?.total || 0,
      current_page: 1,
      per_page: allContacts.length,
      last_page: 1,
      from: 1,
      to: allContacts.length
    };
    
  } catch (error) {
    console.error('Error fetching contacts:', error);
    // Fallback to legacy API for backward compatibility
    return fetchContactsLegacy(page, perPage, type);
  }
};

// Legacy fallback for contacts  
const fetchContactsLegacy = async (page = 1, perPage = 500, type = 'customer') => {
  try {
    let allContacts = [];
    let currentPage = page;
    let hasMorePages = true;
    let totalCount = 0;
    let lastPageInfo = null;

    // If page > 1, just fetch that specific page (for backward compatibility)
    if (page > 1) {
      const response = await legacyApi.get(`/connector/api/contactapi?type=${type}&per_page=${perPage}&page=${page}`);
      return response.data;
    }

    // If page = 1, fetch all contacts across all pages
    while (hasMorePages) {
      const response = await legacyApi.get(`/connector/api/contactapi?type=${type}&per_page=${perPage}&page=${currentPage}`);
      const responseData = response.data;

      if (responseData.data && responseData.data.length > 0) {
        allContacts = [...allContacts, ...responseData.data];
        
        // Store pagination info from first page
        if (currentPage === 1) {
          totalCount = responseData.total || 0;
          lastPageInfo = {
            current_page: responseData.current_page,
            per_page: responseData.per_page,
            total: responseData.total,
            last_page: responseData.last_page,
            from: responseData.from,
            to: responseData.to
          };
        }
        
        // Check if we got fewer contacts than requested (last page)
        if (responseData.data.length < perPage || 
            (responseData.last_page && currentPage >= responseData.last_page)) {
          hasMorePages = false;
        } else {
          currentPage++;
        }
      } else {
        hasMorePages = false;
      }
    }

    // Return in the same format as the original API response
    return {
      data: allContacts,
      total: totalCount,
      current_page: 1,
      per_page: allContacts.length,
      last_page: 1,
      from: 1,
      to: allContacts.length,
      ...lastPageInfo
    };

  } catch (error) {
    console.error('Error fetching contacts (legacy):', error);
    throw error;
  }
};

export const createContact = async (contactData: any) => {
  try {
    const response = await legacyApi.post('/connector/api/contactapi', contactData);
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
    const response = await legacyApi.post('/connector/api/sell', formattedSaleData);
    
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

// ========================================
// Business Details Management
// ========================================

export const fetchBusinessDetails = async () => {
  try {
    console.log('Fetching business details from API...');
    const response = await legacyApi.get('/connector/api/business-details');
    
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
    const response = await legacyApi.get('/connector/api/sell', { params: queryParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

// ============== ATTENDANCE MANAGEMENT ==============
export const getAttendance = async (userId: number) => {
  try {
    const response = await legacyApi.get(`/connector/api/get-attendance/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

export const clockIn = async (data: {
  user_id: number;
  clock_in_time: string;
  clock_in_note?: string;
  ip_address?: string;
  latitude?: string;
  longitude?: string;
}) => {
  try {
    const response = await legacyApi.post('/connector/api/clock-in', data);
    return response.data;
  } catch (error) {
    console.error('Error clocking in:', error);
    throw error;
  }
};

export const clockOut = async (data: {
  user_id: number;
  clock_out_time: string;
  clock_out_note?: string;
  latitude?: string;
  longitude?: string;
}) => {
  try {
    const response = await legacyApi.post('/connector/api/clock-out', data);
    return response.data;
  } catch (error) {
    console.error('Error clocking out:', error);
    throw error;
  }
};

export const listHolidays = async (params: {
  location_id?: number;
  start_date?: string;
  end_date?: string;
}) => {
  try {
    const response = await legacyApi.get('/connector/api/holidays', { params });
    return response.data;
  } catch (error) {
    console.error('Error listing holidays:', error);
    throw error;
  }
};

// ============== BRAND MANAGEMENT ==============
export const listBrands = async () => {
  try {
    const response = await legacyApi.get('/connector/api/brand');
    return response.data;
  } catch (error) {
    console.error('Error listing brands:', error);
    throw error;
  }
};

export const getBrand = async (brandId: string | number) => {
  try {
    const response = await legacyApi.get(`/connector/api/brand/${brandId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching brand:', error);
    throw error;
  }
};

// ============== CASH REGISTER MANAGEMENT ==============
export const listCashRegisters = async (params: {
  status?: string;
  user_id?: number;
  start_date?: string;
  end_date?: string;
  location_id?: number;
  per_page?: number;
} = {}) => {
  try {
    const response = await legacyApi.get('/connector/api/cash-register', { params });
    return response.data;
  } catch (error) {
    console.error('Error listing cash registers:', error);
    throw error;
  }
};

export const createCashRegister = async (data: {
  location_id: number;
  initial_amount: number;
  created_at?: string;
  closed_at?: string;
  status?: string;
  closing_amount?: number;
  total_card_slips?: number;
  total_cheques?: number;
  closing_note?: string;
  transaction_ids?: string;
}) => {
  try {
    const response = await legacyApi.post('/connector/api/cash-register', data);
    return response.data;
  } catch (error) {
    console.error('Error creating cash register:', error);
    throw error;
  }
};

export const getCashRegister = async (registerId: string | number) => {
  try {
    const response = await legacyApi.get(`/connector/api/cash-register/${registerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cash register:', error);
    throw error;
  }
};

// ============== CRM MANAGEMENT ==============
export const listFollowUps = async (params: {
  start_date?: string;
  end_date?: string;
  status?: string;
  follow_up_type?: string;
  followup_category_id?: string | number;
  order_by?: string;
  direction?: string;
  per_page?: number;
} = {}) => {
  try {
    const response = await legacyApi.get('/connector/api/crm/follow-ups', { params });
    return response.data;
  } catch (error) {
    console.error('Error listing follow-ups:', error);
    throw error;
  }
};

export const addFollowUp = async (data: {
  title: string;
  contact_id: number;
  description?: string;
  schedule_type: string;
  user_id?: number[];
  notify_before?: number;
  notify_type?: string;
  status?: string;
  notify_via?: any;
  start_datetime: string;
  end_datetime: string;
  followup_additional_info?: any;
  allow_notification?: boolean;
}) => {
  try {
    const response = await legacyApi.post('/connector/api/crm/follow-ups', data);
    return response.data;
  } catch (error) {
    console.error('Error adding follow-up:', error);
    throw error;
  }
};

export const getFollowUp = async (followUpId: string | number) => {
  try {
    const response = await legacyApi.get(`/connector/api/crm/follow-ups/${followUpId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching follow-up:', error);
    throw error;
  }
};

export const updateFollowUp = async (followUpId: string | number, data: any) => {
  try {
    const response = await legacyApi.put(`/connector/api/crm/follow-ups/${followUpId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating follow-up:', error);
    throw error;
  }
};

export const getFollowUpResources = async () => {
  try {
    const response = await legacyApi.get('/connector/api/crm/follow-up-resources');
    return response.data;
  } catch (error) {
    console.error('Error fetching follow-up resources:', error);
    throw error;
  }
};

export const listLeads = async (params: {
  assigned_to?: string;
  name?: string;
  biz_name?: string;
  mobile_num?: string;
  contact_id?: string;
  order_by?: string;
  direction?: string;
  per_page?: number;
} = {}) => {
  try {
    const response = await legacyApi.get('/connector/api/crm/leads', { params });
    return response.data;
  } catch (error) {
    console.error('Error listing leads:', error);
    throw error;
  }
};

export const saveCallLog = async (data: any) => {
  try {
    const response = await legacyApi.post('/connector/api/crm/call-logs', data);
    return response.data;
  } catch (error) {
    console.error('Error saving call log:', error);
    throw error;
  }
};

// ============== EXPENSE MANAGEMENT ==============
export const listExpenses = async (params: {
  location_id?: number;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
  expense_for?: string;
  per_page?: number;
} = {}) => {
  try {
    const response = await legacyApi.get('/connector/api/expense', { params });
    return response.data;
  } catch (error) {
    console.error('Error listing expenses:', error);
    throw error;
  }
};

export const createExpense = async (data: {
  location_id: number;
  final_total: number;
  transaction_date?: string;
  tax_rate_id?: number;
  expense_for?: number;
  contact_id?: number;
  expense_category_id?: number;
  expense_sub_category_id?: number;
  additional_notes?: string;
  is_refund?: number;
  is_recurring?: number;
  recur_interval?: number;
  recur_interval_type?: string;
  subscription_repeat_on?: number;
  subscription_no?: string;
  recur_repetitions?: number;
  payment?: any[];
}) => {
  try {
    const response = await legacyApi.post('/connector/api/expense', data);
    return response.data;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

export const getExpense = async (expenseId: string | number) => {
  try {
    const response = await legacyApi.get(`/connector/api/expense/${expenseId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expense:', error);
    throw error;
  }
};

export const updateExpense = async (expenseId: string | number, data: any) => {
  try {
    const response = await legacyApi.put(`/connector/api/expense/${expenseId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const listExpenseRefunds = async (params: {
  location_id?: number;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
  expense_for?: string;
  per_page?: number;
} = {}) => {
  try {
    const response = await legacyApi.get('/connector/api/expense-refund', { params });
    return response.data;
  } catch (error) {
    console.error('Error listing expense refunds:', error);
    throw error;
  }
};

export const listExpenseCategories = async () => {
  try {
    const response = await legacyApi.get('/connector/api/expense-categories');
    return response.data;
  } catch (error) {
    console.error('Error listing expense categories:', error);
    throw error;
  }
};

// ============== FIELD FORCE ==============
export const listVisits = async (params: {
  contact_id?: string;
  assigned_to?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  per_page?: number;
  order_by_date?: string;
} = {}) => {
  try {
    const response = await legacyApi.get('/connector/api/field-force', { params });
    return response.data;
  } catch (error) {
    console.error('Error listing visits:', error);
    throw error;
  }
};

export const createVisit = async (data: {
  contact_id: number;
  visit_to?: string;
  visit_address?: string;
  assigned_to: number;
  visit_on: string;
  visit_for?: string;
}) => {
  try {
    const response = await legacyApi.post('/connector/api/field-force/create', data);
    return response.data;
  } catch (error) {
    console.error('Error creating visit:', error);
    throw error;
  }
};

export const updateVisitStatus = async (visitId: string | number, data: any) => {
  try {
    const response = await legacyApi.post(`/connector/api/field-force/${visitId}/update-status`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating visit status:', error);
    throw error;
  }
};

// ============== REPORTS & SYSTEM ==============
export const getProfitLossReport = async (params: {
  location_id?: number;
  start_date?: string;
  end_date?: string;
  user_id?: number;
} = {}) => {
  try {
    const response = await legacyApi.get('/connector/api/profit-loss-report', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching profit/loss report:', error);
    throw error;
  }
};

export const getProductStockReport = async (params: any = {}) => {
  try {
    const response = await legacyApi.get('/connector/api/product-stock-report', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching product stock report:', error);
    throw error;
  }
};

export const getNotifications = async () => {
  try {
    const response = await legacyApi.get('/connector/api/notifications');
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const getLocationFromCoordinates = async (data: { lat: string; lon: string }) => {
  try {
    const response = await legacyApi.get('/connector/api/get-location', { params: data });
    return response.data;
  } catch (error) {
    console.error('Error fetching location from coordinates:', error);
    throw error;
  }
};

export const getPaymentAccounts = async () => {
  try {
    const response = await legacyApi.get('/connector/api/payment-accounts');
    return response.data;
  } catch (error) {
    console.error('Error fetching payment accounts:', error);
    throw error;
  }
};

export const getPaymentMethods = async () => {
  try {
    const response = await legacyApi.get('/connector/api/payment-methods');
    return response.data;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};

// ============== CONTACT PAYMENT ==============
export const contactPayment = async (data: {
  contact_id: number;
  amount: number;
  method: string;
  paid_on: string;
  account_id?: number;
  card_number?: string;
  card_holder_name?: string;
  card_transaction_number?: string;
  card_type?: string;
  card_month?: string;
  card_year?: string;
  card_security?: string;
  transaction_no_1?: string;
  transaction_no_2?: string;
  transaction_no_3?: string;
  cheque_number?: string;
  bank_account_number?: string;
  note?: string;
}) => {
  try {
    const response = await legacyApi.post('/connector/api/contactapi-payment', data);
    return response.data;
  } catch (error) {
    console.error('Error processing contact payment:', error);
    throw error;
  }
};

export default legacyApi;
