/**
 * Offline-First Implementation Examples
 * 
 * This file demonstrates the correct patterns for implementing
 * offline-first functionality throughout the application.
 * 
 * Note: This is an educational/example file with placeholder functions
 * to demonstrate patterns. The actual implementation should use real
 * functions from the codebase.
 */

import { saveSale, saveContact } from '@/lib/storage';
import { queueOperation } from '@/services/syncQueue';
import { queueBackgroundTask, BackgroundTasks, performWhenOnline } from '@/utils/backgroundSync';
import { toast } from 'sonner';

// Placeholder types for examples
declare function createSale(data: any): Promise<any>;
declare function fetchFromAPI(): Promise<any>;
declare function getFromLocalStorage(): Promise<any>;
declare function saveToLocalStorage(data: any): Promise<void>;
declare function getDefaultData(): any;
declare function isValidFormData(data: any): boolean;
declare function saveFormDataLocally(data: any): Promise<void>;
declare function clearForm(): void;
declare function searchLocalData(query: string): Promise<any[]>;
declare function displayResults(results: any[]): void;
declare function searchServer(query: string): Promise<any[]>;
declare function mergeResults(local: any[], server: any[]): any[];
declare function processQueue(): Promise<void>;
declare function syncDataFromServer(): Promise<void>;
declare function performLocalOperation(data: any): Promise<void>;

// ============================================
// ❌ WRONG: Conditional online/offline logic
// ============================================

const wrongSaleCreation = async (saleData: any) => {
  if (navigator.onLine) {
    // Direct API call when online
    await createSale(saleData);
    toast.success('Sale created and synced');
  } else {
    // Different behavior when offline
    await saveSale(saleData);
    toast.info('Sale saved locally (will sync when online)');
  }
};

const wrongDataFetch = async () => {
  if (navigator.onLine) {
    // Fetch from server
    const data = await fetchFromAPI();
    return data;
  } else {
    // Get from local storage
    const data = await getFromLocalStorage();
    return data;
  }
};

// ============================================
// ✅ CORRECT: Offline-first patterns
// ============================================

/**
 * Correct sale creation - always local first, queue for sync
 */
const correctSaleCreation = async (saleData: any) => {
  try {
    // Always store locally first
    await saveSale(saleData);
    
    // Always queue for sync (works online and offline)
    await queueOperation('sale', saleData);
    
    // Always show immediate success
    toast.success('Sale completed successfully');
    
    // User sees immediate response regardless of network status
  } catch (error) {
    // Only fails on local storage issues
    toast.error('Failed to save sale locally');
  }
};

/**
 * Correct customer creation - always local first
 */
const correctCustomerCreation = async (customerData: any) => {
  try {
    // Store locally immediately
    const localId = await saveContact(customerData);
    
    // Queue for background sync
    await queueOperation('customer', { ...customerData, local_id: localId });
    
    // Immediate success feedback
    toast.success('Customer added successfully');
    
    return localId;
  } catch (error) {
    toast.error('Failed to save customer');
    throw error;
  }
};

/**
 * Correct data fetching - local first with background refresh
 */
const correctDataFetch = async (forceRefresh = false) => {
  try {
    // Always try local first
    const localData = await getFromLocalStorage();
    
    if (localData && !forceRefresh) {
      // Return cached data immediately
      console.log('Returning cached data');
      
      // Queue background refresh if online (non-blocking)
      queueBackgroundRefresh();
      
      return localData;
    }
    
    // If no local data, try to fetch directly (only if online)
    if (navigator.onLine && (!localData || forceRefresh)) {
      const freshData = await fetchFromAPI();
      await saveToLocalStorage(freshData);
      return freshData;
    }
    
    // Fallback to local data even if stale
    return localData || getDefaultData();
    
  } catch (error) {
    console.error('Data fetch error:', error);
    // Always return something, never block the UI
    return await getFromLocalStorage() || getDefaultData();
  }
};

/**
 * Background refresh helper
 */
const queueBackgroundRefresh = () => {
  const refreshTask = performWhenOnline(async () => {
    console.log('Background data refresh...');
    const freshData = await fetchFromAPI();
    await saveToLocalStorage(freshData);
    console.log('Background refresh completed');
  });

  queueBackgroundTask('data-refresh', refreshTask);
};

// ============================================
// User interaction patterns
// ============================================

/**
 * Form submission - never blocks on network
 */
const handleFormSubmit = async (formData: any) => {
  try {
    // Validate locally first
    if (!isValidFormData(formData)) {
      toast.error('Please check your input');
      return;
    }
    
    // Save locally immediately
    await saveFormDataLocally(formData);
      // Queue for sync
    await queueOperation('sale', formData);
    
    // Show immediate success
    toast.success('Form submitted successfully');
    
    // Clear form or redirect - don't wait for network
    clearForm();
    
  } catch (error) {
    toast.error('Failed to submit form');
  }
};

/**
 * Search functionality - always responsive
 */
const handleSearch = async (query: string) => {
  try {
    // Search local data immediately
    const localResults = await searchLocalData(query);
    
    // Display results immediately
    displayResults(localResults);
    
    // If online, enhance with server search (non-blocking)
    if (navigator.onLine) {
      queueBackgroundTask('search-enhancement', async () => {
        const serverResults = await searchServer(query);
        // Merge and update results
        const enhancedResults = mergeResults(localResults, serverResults);
        displayResults(enhancedResults);
      });
    }
    
  } catch (error) {
    console.error('Search error:', error);
    // Still show what we can from local data
  }
};

// ============================================
// Network transition handling
// ============================================

/**
 * When going online - process queue automatically
 */
const handleOnlineTransition = async () => {
  console.log('Device came online');
  
  // Start background queue processing
  queueBackgroundTask(BackgroundTasks.QUEUE_PROCESSING, async () => {
    await processQueue();
  });
  
  // Start background data refresh
  queueBackgroundTask('full-sync', async () => {
    await syncDataFromServer();
  });
  
  // Don't block UI or show intrusive messages
};

/**
 * When going offline - continue normal operation
 */
const handleOfflineTransition = () => {
  console.log('Device went offline');
  
  // Application continues to work normally
  // All operations still queue for later sync
  // No functionality is disabled
};

// ============================================
// Error handling patterns
// ============================================

/**
 * Network-independent error handling
 */
const robustOperation = async (data: any) => {
  try {
    // Attempt operation
    await performLocalOperation(data);
      // Queue for sync
    await queueOperation('sale', data);
    
    // Success feedback
    toast.success('Operation completed');
    
  } catch (error) {
    // Only handle actual errors (storage issues, validation, etc.)
    // Network errors are handled by the queue system
    
    if (error.code === 'VALIDATION_ERROR') {
      toast.error('Please check your input');
    } else if (error.code === 'STORAGE_ERROR') {
      toast.error('Failed to save data locally');
    } else {
      toast.error('Operation failed');
    }
    
    // Never show "you are offline" as an error
    // Network status is not an error condition
  }
};

// ============================================
// Key principles demonstrated:
// ============================================

/*
1. ✅ Always store locally first
2. ✅ Always queue operations for sync
3. ✅ Never wait for network calls in user flows
4. ✅ Show immediate feedback
5. ✅ Use background tasks for sync
6. ✅ Network status is enhancement, not requirement
7. ✅ Graceful degradation, never hard failures
8. ✅ Consistent behavior online and offline
*/

export {
  correctSaleCreation,
  correctCustomerCreation,
  correctDataFetch,
  handleFormSubmit,
  handleSearch,
  handleOnlineTransition,
  handleOfflineTransition,
  robustOperation
};
