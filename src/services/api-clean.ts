/**
 * 🚀 Sadiid Offline POS - OpenAPI-Driven API Service
 * 
 * This service provides a clean, type-safe interface to the Sadiid ERP API
 * using OpenAPI-generated types and modular API clients.
 * 
 * Features:
 * - 🔒 Type-safe API calls with OpenAPI-generated types
 * - 📦 Modular API organization by functional area
 * - 🔄 Automatic pagination handling
 * - 💾 Optimized for offline-first data sync
 * - 🚨 Comprehensive error handling
 */

import { saveToken } from '@/lib/storage';

// Import OpenAPI-driven API client and modules
import { apiClient } from '@/lib/api-client';
import { AuthApi } from '@/lib/modules/auth';
import { ProductsApi } from '@/lib/modules/products';
import { TransactionsApi } from '@/lib/modules/transactions';
import { ContactsApi } from '@/lib/modules/contacts';
import { BusinessApi } from '@/lib/modules/business';

// Import OpenAPI-generated types
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
  AuthTokenResponse,
  User,
  BusinessLocation
} from '@/types/api';

// Re-export API modules for direct access
export { apiClient, AuthApi, ProductsApi, TransactionsApi, ContactsApi, BusinessApi };

// ============================================================================
// 🔐 AUTHENTICATION API
// ============================================================================

/**
 * Login user with username and password
 */
export const login = async (username: string, password: string): Promise<AuthTokenResponse> => {
  const response = await AuthApi.login({ username, password });
  
  // Save token for future requests
  saveToken(response.data);
  return response.data;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  return await AuthApi.getCurrentUser();
};

// ============================================================================
// 📦 PRODUCTS API
// ============================================================================

/**
 * Fetch products with intelligent pagination
 * - For page > 1: Returns specific page
 * - For page = 1: Fetches all pages for complete offline sync
 */
export const fetchProducts = async (page = 1, perPage = 500) => {
  console.log('🔍 Fetching products with page:', page, 'perPage:', perPage);
  
  // Get current business location for filtering
  const selectedLocationId = localStorage.getItem('selected_location_id');
  console.log('🏢 Current business location ID:', selectedLocationId);
  
  // If requesting a specific page > 1, return only that page
  if (page > 1) {
    const response = await ProductsApi.getProducts({
      page: page,
      per_page: perPage,
      location_id: selectedLocationId ? parseInt(selectedLocationId) : undefined
    });
    
    const paginatedData = response.data;
    return {
      data: paginatedData?.data || [],
      total: paginatedData?.total || 0,
      current_page: paginatedData?.current_page || page,
      per_page: paginatedData?.per_page || perPage,
      last_page: paginatedData?.last_page || 1,
      from: ((page - 1) * perPage) + 1,
      to: Math.min(page * perPage, paginatedData?.total || 0)
    };
  }
  
  // For page = 1, fetch all pages to get complete data set for offline sync
  let allProducts: Product[] = [];
  let currentPage = 1;
  let hasMorePages = true;
  
  while (hasMorePages) {
    console.log('🔍 Fetching products page', currentPage);
    
    try {
      const response = await ProductsApi.getProducts({
        page: currentPage,
        per_page: perPage,
        location_id: selectedLocationId ? parseInt(selectedLocationId) : undefined
      });
      
      const paginatedData = response.data;
      const pageProducts = paginatedData?.data || [];
      
      if (pageProducts.length > 0) {
        allProducts = [...allProducts, ...pageProducts];
        console.log(`🔍 Added ${pageProducts.length} products from page ${currentPage}. Total: ${allProducts.length}`);
        
        // Check if we have more pages
        const lastPage = paginatedData?.last_page || 1;
        if (currentPage >= lastPage) {
          console.log('🔍 Reached last page:', lastPage);
          hasMorePages = false;
        } else {
          currentPage++;
        }
      } else {
        console.log('🔍 No products in page', currentPage, 'stopping pagination');
        hasMorePages = false;
      }
      
      // Safety check to prevent infinite loops
      if (currentPage > 100) {
        console.warn('🔍 Reached maximum page limit (100), stopping');
        break;
      }
      
    } catch (pageError) {
      console.warn(`Failed to fetch products page ${currentPage}:`, pageError);
      break;
    }
  }
  
  console.log('🔍 Total products fetched:', allProducts.length);
  
  return {
    data: allProducts,
    total: allProducts.length,
    current_page: 1,
    per_page: allProducts.length,
    last_page: 1,
    from: 1,
    to: allProducts.length
  };
};

/**
 * Get single product by ID
 */
export const getProduct = async (id: number): Promise<ApiResponse<Product>> => {
  return await ProductsApi.getProduct(id);
};

// ============================================================================
// 👥 CONTACTS API
// ============================================================================

/**
 * Fetch contacts with intelligent pagination
 * - For page > 1: Returns specific page
 * - For page = 1: Fetches all pages for complete offline sync
 */
export const fetchContacts = async (
  page = 1, 
  perPage = 500, 
  type: 'customer' | 'supplier' | 'both' = 'customer'
) => {
  console.log('🔍 Fetching contacts with page:', page, 'perPage:', perPage, 'type:', type);
  
  // If requesting a specific page > 1, return only that page
  if (page > 1) {
    const response = await ContactsApi.getContacts({
      type,
      page: page,
      per_page: perPage
    });
    
    return response.data;
  }
  
  // For page = 1, fetch all pages to get complete data set for offline sync
  let allContacts: Contact[] = [];
  let currentPage = 1;
  let hasMorePages = true;
  
  while (hasMorePages) {
    console.log('🔍 Fetching contacts page', currentPage);
    
    try {
      const response = await ContactsApi.getContacts({
        type,
        page: currentPage,
        per_page: perPage
      });
      
      const paginatedData = response.data;
      const pageContacts = paginatedData?.data || [];
      
      if (pageContacts.length > 0) {
        allContacts = [...allContacts, ...pageContacts];
        console.log(`🔍 Added ${pageContacts.length} contacts from page ${currentPage}. Total: ${allContacts.length}`);
        
        // Check if we have more pages
        const lastPage = paginatedData?.last_page || 1;
        if (currentPage >= lastPage) {
          console.log('🔍 Reached last page:', lastPage);
          hasMorePages = false;
        } else {
          currentPage++;
        }
      } else {
        console.log('🔍 No contacts in page', currentPage, 'stopping pagination');
        hasMorePages = false;
      }
      
      // Safety check to prevent infinite loops
      if (currentPage > 100) {
        console.warn('🔍 Reached maximum page limit (100), stopping');
        break;
      }
      
    } catch (pageError) {
      console.warn(`Failed to fetch contacts page ${currentPage}:`, pageError);
      break;
    }
  }
  
  console.log('🔍 Total contacts fetched:', allContacts.length);
  
  return {
    data: allContacts,
    total: allContacts.length,
    current_page: 1,
    per_page: allContacts.length,
    last_page: 1,
    from: 1,
    to: allContacts.length
  };
};

/**
 * Create new contact
 */
export const createContact = async (contactData: ContactCreateRequest): Promise<ApiResponse<Contact>> => {
  return await ContactsApi.createContact(contactData);
};

/**
 * Get single contact by ID
 */
export const getContact = async (id: number): Promise<ApiResponse<Contact>> => {
  return await ContactsApi.getContact(id);
};

// ============================================================================
// 🏢 BUSINESS API
// ============================================================================

/**
 * Get business details
 */
export const fetchBusinessDetails = async (): Promise<ApiResponse<Business>> => {
  console.log('Fetching business details from API...');
  
  const response = await BusinessApi.getBusinessDetails();
  
  console.log('API Response status: 200');
  console.log('API Response data structure:', {
    hasData: !!response.data,
    hasDataProperty: !!response.data,
    dataKeys: response.data ? Object.keys(response.data) : [],
    dataDataKeys: response.data ? Object.keys(response.data) : []
  });
  
  return response;
};

/**
 * Get business locations
 */
export const getBusinessLocations = async (): Promise<ApiResponse<BusinessLocation[]>> => {
  return await BusinessApi.getBusinessLocations();
};

// ============================================================================
// 💰 TRANSACTIONS API
// ============================================================================

/**
 * Create new sale transaction
 */
export const createSale = async (saleData: TransactionCreateRequest): Promise<ApiResponse<Transaction>> => {
  return await TransactionsApi.createTransaction(saleData);
};

/**
 * Fetch sales/transactions with pagination
 */
export const fetchSales = async (page = 1, perPage = 50, params = {}) => {
  const response = await TransactionsApi.getTransactions({
    page,
    per_page: perPage,
    ...params
  });
  
  return response.data;
};

/**
 * Get single transaction by ID
 */
export const getTransaction = async (id: number): Promise<ApiResponse<Transaction>> => {
  return await TransactionsApi.getTransaction(id);
};

// ============================================================================
// 📊 UTILITY FUNCTIONS
// ============================================================================

/**
 * Generic function to fetch all pages of any paginated endpoint
 */
export const fetchAllPages = async <T>(
  fetchFunction: (page: number, perPage: number) => Promise<PaginatedResponse<T>>,
  perPage = 500
): Promise<T[]> => {
  let allItems: T[] = [];
  let currentPage = 1;
  let hasMorePages = true;
  
  while (hasMorePages) {
    try {
      const response = await fetchFunction(currentPage, perPage);
      const pageItems = response.data || [];
      
      if (pageItems.length > 0) {
        allItems = [...allItems, ...pageItems];
        
        // Check if we have more pages
        const lastPage = response.last_page || 1;
        if (currentPage >= lastPage) {
          hasMorePages = false;
        } else {
          currentPage++;
        }
      } else {
        hasMorePages = false;
      }
      
      // Safety check
      if (currentPage > 100) {
        console.warn('Reached maximum page limit (100), stopping');
        break;
      }
      
    } catch (error) {
      console.warn(`Failed to fetch page ${currentPage}:`, error);
      break;
    }
  }
  
  return allItems;
};

// ============================================================================
// 📋 TYPE EXPORTS
// ============================================================================

// Export commonly used types for external use
export type {
  Product,
  Contact,
  Transaction,
  Business,
  BusinessLocation,
  User,
  PaginatedResponse,
  ApiResponse,
  AuthTokenResponse,
  LoginRequest,
  TransactionCreateRequest,
  ContactCreateRequest
};
