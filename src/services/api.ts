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
  customer_id?: number | null; // Add this to support both formats
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

    // Use contact_id if provided, otherwise use customer_id, fall back to walk-in customer (1)
    const contactId = saleData.contact_id || saleData.customer_id || 1;
    
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
    const sellData: any = {  // Change to 'any' type or define a specific interface
      location_id: saleData.location_id,
      contact_id: contactId,
      transaction_date: saleData.transaction_date,
      status: saleData.status,
      payments: [], // Initialize payments array to avoid TypeScript error
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

// ============== ATTENDANCE MANAGEMENT ==============
export const getAttendance = async (userId: number) => {
  try {
    const response = await api.get(`/connector/api/get-attendance/${userId}`);
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
    const response = await api.post('/connector/api/clock-in', data);
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
    const response = await api.post('/connector/api/clock-out', data);
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
    const response = await api.get('/connector/api/holidays', { params });
    return response.data;
  } catch (error) {
    console.error('Error listing holidays:', error);
    throw error;
  }
};

// ============== BRAND MANAGEMENT ==============
export const listBrands = async () => {
  try {
    const response = await api.get('/connector/api/brand');
    return response.data;
  } catch (error) {
    console.error('Error listing brands:', error);
    throw error;
  }
};

export const getBrand = async (brandId: string | number) => {
  try {
    const response = await api.get(`/connector/api/brand/${brandId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching brand:', error);
    throw error;
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
    const response = await api.get('/connector/api/cash-register', { params });
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
    const response = await api.post('/connector/api/cash-register', data);
    return response.data;
  } catch (error) {
    console.error('Error creating cash register:', error);
    throw error;
  }
};

export const getCashRegister = async (registerId: string | number) => {
  try {
    const response = await api.get(`/connector/api/cash-register/${registerId}`);
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
    const response = await api.get('/connector/api/crm/follow-ups', { params });
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
    const response = await api.post('/connector/api/crm/follow-ups', data);
    return response.data;
  } catch (error) {
    console.error('Error adding follow-up:', error);
    throw error;
  }
};

export const getFollowUp = async (followUpId: string | number) => {
  try {
    const response = await api.get(`/connector/api/crm/follow-ups/${followUpId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching follow-up:', error);
    throw error;
  }
};

export const updateFollowUp = async (followUpId: string | number, data: any) => {
  try {
    const response = await api.put(`/connector/api/crm/follow-ups/${followUpId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating follow-up:', error);
    throw error;
  }
};

export const getFollowUpResources = async () => {
  try {
    const response = await api.get('/connector/api/crm/follow-up-resources');
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
    const response = await api.get('/connector/api/crm/leads', { params });
    return response.data;
  } catch (error) {
    console.error('Error listing leads:', error);
    throw error;
  }
};

export const saveCallLog = async (data: any) => {
  try {
    const response = await api.post('/connector/api/crm/call-logs', data);
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
    const response = await api.get('/connector/api/expense', { params });
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
    const response = await api.post('/connector/api/expense', data);
    return response.data;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

export const getExpense = async (expenseId: string | number) => {
  try {
    const response = await api.get(`/connector/api/expense/${expenseId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expense:', error);
    throw error;
  }
};

export const updateExpense = async (expenseId: string | number, data: any) => {
  try {
    const response = await api.put(`/connector/api/expense/${expenseId}`, data);
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
    const response = await api.get('/connector/api/expense-refund', { params });
    return response.data;
  } catch (error) {
    console.error('Error listing expense refunds:', error);
    throw error;
  }
};

export const listExpenseCategories = async () => {
  try {
    const response = await api.get('/connector/api/expense-categories');
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
    const response = await api.get('/connector/api/field-force', { params });
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
    const response = await api.post('/connector/api/field-force/create', data);
    return response.data;
  } catch (error) {
    console.error('Error creating visit:', error);
    throw error;
  }
};

export const updateVisitStatus = async (visitId: string | number, data: any) => {
  try {
    const response = await api.post(`/connector/api/field-force/${visitId}/update-status`, data);
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
    const response = await api.get('/connector/api/profit-loss-report', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching profit/loss report:', error);
    throw error;
  }
};

export const getProductStockReport = async (params: any = {}) => {
  try {
    const response = await api.get('/connector/api/product-stock-report', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching product stock report:', error);
    throw error;
  }
};

export const getNotifications = async () => {
  try {
    const response = await api.get('/connector/api/notifications');
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const getLocationFromCoordinates = async (data: { lat: string; lon: string }) => {
  try {
    const response = await api.get('/connector/api/get-location', { data });
    return response.data;
  } catch (error) {
    console.error('Error fetching location from coordinates:', error);
    throw error;
  }
};

export const getPaymentAccounts = async () => {
  try {
    const response = await api.get('/connector/api/payment-accounts');
    return response.data;
  } catch (error) {
    console.error('Error fetching payment accounts:', error);
    throw error;
  }
};

export const getPaymentMethods = async () => {
  try {
    const response = await api.get('/connector/api/payment-methods');
    return response.data;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};

// ============== CONTACT MANAGEMENT ==============
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
    const response = await api.post('/connector/api/contactapi-payment', data);
    return response.data;
  } catch (error) {
    console.error('Error processing contact payment:', error);
    throw error;
  }
};

export default api;
