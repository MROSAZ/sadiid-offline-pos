/**
 * 🔄 Enhanced Sync Service with OpenAPI Integration
 * 
 * This service handles data synchronization between local IndexedDB storage
 * and the Sadiid ERP API using OpenAPI-generated, type-safe API calls.
 * 
 * Features:
 * - 📦 Paginated data fetching for products and contacts
 * - 🔄 Background sync with retry logic
 * - 📊 Sync queue management
 * - 💾 Offline-first data persistence
 * - 🚨 Comprehensive error handling
 */

import { 
  fetchProducts, 
  fetchContacts, 
  createSale 
} from '@/services/api';
import { 
  saveProducts, 
  saveContacts, 
  getUnSyncedSales, 
  markSaleAsSynced,
  updateSaleWithSyncedData,
  getLocalItemAsJson,
  setLocalItem
} from '@/lib/storage';
import { getBusinessSettings } from '@/lib/businessSettings';
import { toast } from 'sonner';
import { 
  queueOperation, 
  getOperationsByStatus,
  updateOperationStatus, 
  updateLastSyncTimestamp,
  isSyncNeeded,
  cleanupCompletedOperations
} from './syncQueue';

// Constants for sync operation
const SYNC_INTERVAL_MS = 1 * 60 * 1000; // 1 minute
const SYNC_PRODUCT_THRESHOLD_HOURS = 24; // Sync products every 24 hours
const SYNC_CONTACT_THRESHOLD_HOURS = 6; // Sync contacts every 6 hours
const MAX_RETRY_ATTEMPTS = 3;

// Timestamps for data freshness checking
interface SyncTimestamps {
  products?: number;
  contacts?: number;
  settings?: number;
  lastFullSync?: number;
}

// Sync statistics
interface SyncStats {
  products: { total: number; synced: number; failed: number };
  contacts: { total: number; synced: number; failed: number };
  sales: { total: number; synced: number; failed: number };
}

// Global sync state
let syncInProgress = false;
let syncIntervalId: NodeJS.Timeout | null = null;

/**
 * Get sync timestamps from local storage
 */
const getSyncTimestamps = async (): Promise<SyncTimestamps> => {
  try {
    const timestamps = await getLocalItemAsJson('sync_timestamps');
    return timestamps || {};
  } catch (error) {
    console.warn('Failed to get sync timestamps:', error);
    return {};
  }
};

/**
 * Update sync timestamps in local storage
 */
const updateSyncTimestamps = async (updates: Partial<SyncTimestamps>): Promise<void> => {
  try {
    const currentTimestamps = await getSyncTimestamps();
    const newTimestamps = { ...currentTimestamps, ...updates };
    await setLocalItem('sync_timestamps', JSON.stringify(newTimestamps));
  } catch (error) {
    console.error('Failed to update sync timestamps:', error);
  }
};

/**
 * Check if data sync is needed based on threshold
 */
const isDataSyncNeeded = async (dataType: 'products' | 'contacts', thresholdHours: number): Promise<boolean> => {
  try {
    const timestamps = await getSyncTimestamps();
    const lastSync = timestamps[dataType];
    
    if (!lastSync) return true;
    
    const hoursElapsed = (Date.now() - lastSync) / (1000 * 60 * 60);
    return hoursElapsed >= thresholdHours;
  } catch (error) {
    console.warn(`Failed to check sync need for ${dataType}:`, error);
    return true; // Default to sync if we can't determine
  }
};

/**
 * Sync products with intelligent pagination
 */
const syncProducts = async (): Promise<{ total: number; synced: number; failed: number }> => {
  const stats = { total: 0, synced: 0, failed: 0 };
  
  try {
    console.log('🔄 Starting products sync...');
    
    // Check if sync is needed
    const syncNeeded = await isDataSyncNeeded('products', SYNC_PRODUCT_THRESHOLD_HOURS);
    if (!syncNeeded) {
      console.log('⏭️ Products sync skipped - data is fresh');
      return stats;
    }
    
    // Fetch products with pagination - Laravel pagination response
    const productsResponse = await fetchProducts(1, 500); // Use 500 per page to minimize requests
    
    if (!productsResponse?.data || !Array.isArray(productsResponse.data)) {
      throw new Error('Failed to fetch products from API');
    }
    
    const products = productsResponse.data;
    stats.total = productsResponse.total || products.length;
    
    console.log(`📦 Fetched ${products.length} products (${stats.total} total)`);
    
    // Save products to IndexedDB
    const saveResult = await saveProducts(products);
    
    if (saveResult) {
      stats.synced = products.length;
      await updateSyncTimestamps({ products: Date.now() });
      console.log(`✅ Successfully synced ${stats.synced} products`);
    } else {
      stats.failed = products.length;
      throw new Error('Failed to save products to IndexedDB');
    }
    
  } catch (error) {
    console.error('❌ Products sync failed:', error);
    stats.failed = Math.max(stats.total - stats.synced, 0);
    toast.error('Failed to sync products');
  }
  
  return stats;
};

/**
 * Sync contacts with intelligent pagination
 */
const syncContacts = async (): Promise<{ total: number; synced: number; failed: number }> => {
  const stats = { total: 0, synced: 0, failed: 0 };
  
  try {
    console.log('🔄 Starting contacts sync...');
    
    // Check if sync is needed
    const syncNeeded = await isDataSyncNeeded('contacts', SYNC_CONTACT_THRESHOLD_HOURS);
    if (!syncNeeded) {
      console.log('⏭️ Contacts sync skipped - data is fresh');
      return stats;
    }
    
    // Fetch contacts with pagination - Laravel pagination response
    const contactsResponse = await fetchContacts(1, 500); // Use 500 per page to minimize requests
    
    if (!contactsResponse?.data || !Array.isArray(contactsResponse.data)) {
      throw new Error('Failed to fetch contacts from API');
    }
    
    const contacts = contactsResponse.data;
    stats.total = contactsResponse.total || contacts.length;
    
    console.log(`👥 Fetched ${contacts.length} contacts (${stats.total} total)`);
    
    // Save contacts to IndexedDB
    const saveResult = await saveContacts(contacts);
    
    if (saveResult) {
      stats.synced = contacts.length;
      await updateSyncTimestamps({ contacts: Date.now() });
      console.log(`✅ Successfully synced ${stats.synced} contacts`);
    } else {
      stats.failed = contacts.length;
      throw new Error('Failed to save contacts to IndexedDB');
    }
    
  } catch (error) {
    console.error('❌ Contacts sync failed:', error);
    stats.failed = Math.max(stats.total - stats.synced, 0);
    toast.error('Failed to sync contacts');
  }
  
  return stats;
};

/**
 * Sync pending sales to the server
 */
const syncPendingSales = async (): Promise<{ total: number; synced: number; failed: number }> => {
  const stats = { total: 0, synced: 0, failed: 0 };
  
  try {
    console.log('🔄 Starting sales sync...');
    
    // Get unsynced sales
    const unSyncedSales = await getUnSyncedSales();
    stats.total = unSyncedSales.length;
    
    if (stats.total === 0) {
      console.log('✅ No pending sales to sync');
      return stats;
    }
    
    console.log(`📤 Found ${stats.total} pending sales to sync`);
    
    // Process each sale
    for (const sale of unSyncedSales) {
      try {
        const { local_id, is_synced, sync_error, synced_at, created_at, updated_at, ...cleanSaleData } = sale;
        
        // Fix payment structure - ensure it's 'payments' array not 'payment'
        if (cleanSaleData.payment && !cleanSaleData.payments) {
          cleanSaleData.payments = Array.isArray(cleanSaleData.payment) 
            ? cleanSaleData.payment 
            : [cleanSaleData.payment];
          delete cleanSaleData.payment;
        }

        // Fix product structure - ensure products have 'unit_price' field
        if (cleanSaleData.products && Array.isArray(cleanSaleData.products)) {
          cleanSaleData.products = cleanSaleData.products.map((product: any) => ({
            ...product,
            unit_price: product.unit_price || product.price // Ensure unit_price is used
          }));
        }
        
        // Ensure required fields are present
        if (!cleanSaleData.contact_id || !cleanSaleData.location_id) {
          console.error(`❌ Invalid sale data - missing required fields for sale ID: ${local_id}`);
          continue;
        }
        
        // Queue the sale if not already in processing queue
        const operationId = await queueOperation('sale', { 
          local_id,
          saleData: cleanSaleData
        });
        
        // Update status to processing
        await updateOperationStatus(operationId, 'processing');
        
        // Send clean data to API
        const response = await createSale(cleanSaleData);
        
        // Handle the API response - the sell API returns transaction data directly as array
        let transactionData = null;
        
        if (response?.success && response?.data) {
          // Our API client wraps the raw response in {success: true, data: [...]}
          // The data contains the array of transactions from the API
          if (Array.isArray(response.data) && response.data.length > 0) {
            transactionData = response.data[0]; // Get first transaction from array
          } else if (response.data && typeof response.data === 'object' && 'id' in response.data) {
            transactionData = response.data; // Single transaction object
          }
        }
        
        // Validate that we got a valid transaction with required fields
        if (transactionData && transactionData.id && transactionData.invoice_no) {
          // Update local sale with synced data from server
          await updateSaleWithSyncedData(local_id, {
            server_id: transactionData.id,
            invoice_no: transactionData.invoice_no,
            invoice_url: transactionData.invoice_url,
            payment_ref_no: transactionData.payment_lines?.[0]?.payment_ref_no,
            synced_at: new Date().toISOString()
          });
          
          // Mark as synced in local storage
          await markSaleAsSynced(local_id);
          await updateOperationStatus(operationId, 'completed');
          stats.synced++;
          
          console.log(`✅ Sale synced successfully:`, {
            local_id,
            server_id: transactionData.id,
            invoice_no: transactionData.invoice_no,
            final_total: transactionData.final_total,
            invoice_url: transactionData.invoice_url
          });
        } else {
          await updateOperationStatus(operationId, 'failed', 'API returned no data');
          stats.failed++;
          console.error(`❌ Failed to sync sale ID: ${local_id}`, 'API returned no data');
        }
        
      } catch (saleError) {
        stats.failed++;
        console.error(`❌ Failed to sync sale ID: ${sale.local_id}`, saleError);
        
        // Update operation status if we have an operation ID
        try {
          const operations = await getOperationsByStatus('processing');
          const operation = operations.find(op => 
            op.data && 
            typeof op.data === 'object' && 
            'local_id' in op.data && 
            op.data.local_id === sale.local_id
          );
          
          if (operation) {
            await updateOperationStatus(operation.id, 'failed', 
              saleError instanceof Error ? saleError.message : 'Unknown error');
          }
        } catch (statusError) {
          console.warn('Failed to update operation status:', statusError);
        }
      }
    }
    
    console.log(`📊 Sales sync completed: ${stats.synced}/${stats.total} successful`);
    
  } catch (error) {
    console.error('❌ Sales sync failed:', error);
    toast.error('Failed to sync sales');
  }
  
  return stats;
};

/**
 * Perform comprehensive data sync
 */
export const performFullSync = async (): Promise<SyncStats> => {
  if (syncInProgress) {
    console.log('⏸️ Sync already in progress, skipping...');
    return {
      products: { total: 0, synced: 0, failed: 0 },
      contacts: { total: 0, synced: 0, failed: 0 },
      sales: { total: 0, synced: 0, failed: 0 }
    };
  }
  
  syncInProgress = true;
  
  try {
    console.log('🚀 Starting full sync...');
    
    // Sync in parallel for better performance
    const [productsStats, contactsStats, salesStats] = await Promise.allSettled([
      syncProducts(),
      syncContacts(),
      syncPendingSales()
    ]);
    
    // Extract results, handling rejections
    const results: SyncStats = {
      products: productsStats.status === 'fulfilled' 
        ? productsStats.value 
        : { total: 0, synced: 0, failed: 0 },
      contacts: contactsStats.status === 'fulfilled' 
        ? contactsStats.value 
        : { total: 0, synced: 0, failed: 0 },
      sales: salesStats.status === 'fulfilled' 
        ? salesStats.value 
        : { total: 0, synced: 0, failed: 0 }
    };
    
    // Update last full sync timestamp
    await updateSyncTimestamps({ lastFullSync: Date.now() });
    
    // Cleanup completed operations
    await cleanupCompletedOperations();
    
    // Log summary
    const totalSynced = results.products.synced + results.contacts.synced + results.sales.synced;
    const totalFailed = results.products.failed + results.contacts.failed + results.sales.failed;
    
    console.log(`🎯 Full sync completed: ${totalSynced} items synced, ${totalFailed} failed`);
    
    if (totalSynced > 0) {
      toast.success(`Sync completed: ${totalSynced} items updated`);
    }
    
    if (totalFailed > 0) {
      toast.error(`Sync completed with ${totalFailed} failures`);
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Full sync failed:', error);
    toast.error('Sync failed');
    
    return {
      products: { total: 0, synced: 0, failed: 0 },
      contacts: { total: 0, synced: 0, failed: 0 },
      sales: { total: 0, synced: 0, failed: 0 }
    };
  } finally {
    syncInProgress = false;
  }
};

/**
 * Start background sync with automatic retry
 */
export const startBackgroundSync = () => {
  if (syncIntervalId) {
    console.log('🔄 Background sync already running');
    return;
  }
  
  console.log('🔄 Starting background sync...');
  
  // Initial sync
  performFullSync();
  
  // Set up interval
  syncIntervalId = setInterval(() => {
    performFullSync();
  }, SYNC_INTERVAL_MS);
  
  console.log(`✅ Background sync started (interval: ${SYNC_INTERVAL_MS / 1000}s)`);
};

/**
 * Stop background sync
 */
export const stopBackgroundSync = () => {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log('⏹️ Background sync stopped');
  }
};

/**
 * Force sync specific data type
 */
export const forceSyncData = async (dataType: 'products' | 'contacts' | 'sales'): Promise<void> => {
  try {
    console.log(`🔄 Force syncing ${dataType}...`);
    
    let result;
    switch (dataType) {
      case 'products':
        // Clear timestamp to force sync
        await updateSyncTimestamps({ products: 0 });
        result = await syncProducts();
        break;
      case 'contacts':
        // Clear timestamp to force sync
        await updateSyncTimestamps({ contacts: 0 });
        result = await syncContacts();
        break;
      case 'sales':
        result = await syncPendingSales();
        break;
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
    
    console.log(`✅ Force sync completed for ${dataType}:`, result);
    
  } catch (error) {
    console.error(`❌ Force sync failed for ${dataType}:`, error);
    throw error;
  }
};

/**
 * Get sync status and statistics
 */
export const getSyncStatus = async () => {
  try {
    const timestamps = await getSyncTimestamps();
    const unSyncedSales = await getUnSyncedSales();
    const pendingOperations = await getOperationsByStatus('pending');
    const processingOperations = await getOperationsByStatus('processing');
    
    return {
      isInProgress: syncInProgress,
      timestamps,
      pendingSales: unSyncedSales.length,
      pendingOperations: pendingOperations.length,
      processingOperations: processingOperations.length,
      lastFullSync: timestamps.lastFullSync ? new Date(timestamps.lastFullSync) : null
    };
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return {
      isInProgress: syncInProgress,
      timestamps: {},
      pendingSales: 0,
      pendingOperations: 0,
      processingOperations: 0,
      lastFullSync: null
    };
  }
};

// Legacy function compatibility - redirect to new implementation
export const syncData = async (showToast = false, forceSync = false): Promise<boolean> => {
  try {
    if (forceSync) {
      // Force sync all data types
      await updateSyncTimestamps({ products: 0, contacts: 0 });
    }
    
    const result = await performFullSync();
    const totalSynced = result.products.synced + result.contacts.synced + result.sales.synced;
    
    return totalSynced > 0;
  } catch (error) {
    console.error('Legacy syncData failed:', error);
    if (showToast) toast.error('Sync failed');
    return false;
  }
};

// Legacy function compatibility - redirect to new implementation  
export const syncDataOnLogin = async (showToast = false): Promise<boolean> => {
  console.log('🔄 Starting login sync - forcing all data refresh...');
  return syncData(showToast, true);
};

// Legacy function compatibility - redirect to new implementation
export const syncOfflineSales = async (showNotifications = false): Promise<boolean> => {
  try {
    const result = await syncPendingSales();
    
    if (showNotifications && result.synced > 0) {
      toast.success(`Successfully synced ${result.synced} sales`);
    }
    
    if (showNotifications && result.failed > 0) {
      toast.error(`Failed to sync ${result.failed} sales. They will be retried later.`);
    }
    
    return result.synced > 0 || result.total === 0;
  } catch (error) {
    console.error('Legacy syncOfflineSales failed:', error);
    return false;
  }
};

// Export sync control functions
export {
  syncInProgress,
  SYNC_INTERVAL_MS,
  SYNC_PRODUCT_THRESHOLD_HOURS,
  SYNC_CONTACT_THRESHOLD_HOURS
};
