
/**
 * Enhanced sync service with retry logic and queue management
 */
import { fetchProducts, fetchContacts, createSale } from '@/services/api';
import { 
  saveProducts, 
  saveContacts, 
  getUnSyncedSales, 
  markSaleAsSynced, 
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
} from '@/services/syncQueue';

// Constants for sync operation
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
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

// Get sync timestamps from local storage
const getSyncTimestamps = (): SyncTimestamps => {
  return getLocalItemAsJson<SyncTimestamps>('sync_timestamps') || {};
};

// Update sync timestamps
const updateSyncTimestamp = (type: keyof SyncTimestamps): void => {
  const timestamps = getSyncTimestamps();
  timestamps[type] = Date.now();
  
  // Check if all required types are updated for a full sync
  if (type === 'products' || type === 'contacts' || type === 'settings') {
    if (timestamps.products && timestamps.contacts && timestamps.settings) {
      timestamps.lastFullSync = Date.now();
    }
  }
  
  setLocalItem('sync_timestamps', JSON.stringify(timestamps));
};

// Check if specific data needs synchronization based on threshold
const isDataSyncNeeded = (type: keyof SyncTimestamps, thresholdHours: number): boolean => {
  const timestamps = getSyncTimestamps();
  const timestamp = timestamps[type];
  
  if (!timestamp) return true;
  
  const thresholdMs = thresholdHours * 60 * 60 * 1000;
  return (Date.now() - timestamp) > thresholdMs;
};

// Process offline sales and upload them to server
export const syncOfflineSales = async (showNotifications = false): Promise<boolean> => {
  try {
    const unSyncedSales = await getUnSyncedSales();
    console.log(`Found ${unSyncedSales.length} unsynced sales`);
    
    if (unSyncedSales.length === 0) {
      return true;
    }
    
    let syncedCount = 0;
    let failedCount = 0;
    
    for (const sale of unSyncedSales) {
      try {
        // Extract local properties before sending to API
        const { local_id, is_synced, ...saleData } = sale;
        
        // Queue the sale if not already in processing queue
        const operationId = await queueOperation('sale', { 
          local_id,
          saleData
        });
        
        // Update status to processing
        await updateOperationStatus(operationId, 'processing');
        
        // Send to API
        const response = await createSale(saleData);
        
        // Check response
        if (response.success) {
          // Mark as synced
          await markSaleAsSynced(local_id);
          await updateOperationStatus(operationId, 'completed');
          syncedCount++;
          console.log(`Synced sale ID: ${local_id}`);
        } else {
          await updateOperationStatus(operationId, 'failed', response.error || 'Unknown error');
          failedCount++;
          console.error(`Failed to sync sale ID: ${local_id}`, response.error);
        }
      } catch (error) {
        failedCount++;
        console.error(`Error syncing sale ID ${sale.local_id}:`, error);
      }
    }
    
    if (showNotifications) {
      if (syncedCount > 0) {
        toast.success(`Successfully synced ${syncedCount} sales`);
      }
      
      if (failedCount > 0) {
        toast.error(`Failed to sync ${failedCount} sales. They will be retried later.`);
      }
    }
    
    console.log(`Successfully synced ${syncedCount}/${unSyncedSales.length} offline sales`);
    return syncedCount > 0 || unSyncedSales.length === 0;
  } catch (error) {
    console.error('Error in syncOfflineSales:', error);
    return false;
  }
};

// Process failed operations
export const processFailedOperations = async (): Promise<void> => {
  try {
    const failedOps = await getOperationsByStatus('failed');
    
    if (failedOps.length === 0) {
      return;
    }
    
    console.log(`Processing ${failedOps.length} failed operations`);
    
    for (const op of failedOps) {
      // Skip if max retry attempts reached
      if (op.attempts >= MAX_RETRY_ATTEMPTS) {
        console.log(`Operation ${op.id} exceeded max retry attempts`);
        continue;
      }
      
      // Update status to processing
      await updateOperationStatus(op.id, 'processing');
      
      try {
        // Process based on operation type
        if (op.type === 'sale') {
          const { local_id, saleData } = op.data;
          const response = await createSale(saleData);
          
          if (response.success) {
            await markSaleAsSynced(local_id);
            await updateOperationStatus(op.id, 'completed');
            console.log(`Retried and completed sale sync for ID: ${local_id}`);
          } else {
            await updateOperationStatus(op.id, 'failed', response.error || 'Unknown error');
          }
        }
        // Add other operation types here as needed
      } catch (error: any) {
        await updateOperationStatus(op.id, 'failed', error.message || 'Error during retry');
      }
    }
  } catch (error) {
    console.error('Error processing failed operations:', error);
  }
};

// Enhanced sync data function with optimized data fetching
export const syncData = async (showToast = false, forceSync = false): Promise<boolean> => {
  try {
    const isOnline = navigator.onLine;
    if (!isOnline) {
      if (showToast) toast.error("You're offline. Can't sync data.");
      return false;
    }
    
    // Clean up old completed operations
    await cleanupCompletedOperations();
    
    // First try to sync any offline sales
    try {
      await syncOfflineSales(showToast);
    } catch (error) {
      console.error('Error syncing offline sales:', error);
      if (showToast) toast.error('Failed to sync offline sales');
    }
    
    // Process any failed operations from previous attempts
    try {
      await processFailedOperations();
    } catch (error) {
      console.error('Error processing failed operations:', error);
    }
    
    // Check if we need to sync products
    if (forceSync || isDataSyncNeeded('products', SYNC_PRODUCT_THRESHOLD_HOURS)) {
      try {
        const productsResponse = await fetchProducts(1, 1000); // Adjust limits as needed
        if (productsResponse.data) {
          await saveProducts(productsResponse.data);
          updateSyncTimestamp('products');
          console.log(`Synced ${productsResponse.data.length} products`);
        }
      } catch (error) {
        console.error('Error syncing products:', error);
        if (showToast) toast.error('Failed to sync products');
      }
    } else {
      console.log('Products sync skipped - data is fresh');
    }
    
    // Check if we need to sync contacts
    if (forceSync || isDataSyncNeeded('contacts', SYNC_CONTACT_THRESHOLD_HOURS)) {
      try {
        const contactsResponse = await fetchContacts(1, 1000); // Adjust limits as needed
        if (contactsResponse.data) {
          await saveContacts(contactsResponse.data);
          updateSyncTimestamp('contacts');
          console.log(`Synced ${contactsResponse.data.length} contacts`);
        }
      } catch (error) {
        console.error('Error syncing contacts:', error);
        if (showToast) toast.error('Failed to sync contacts');
      }
    } else {
      console.log('Contacts sync skipped - data is fresh');
    }
    
    // Sync settings
    try {
      await getBusinessSettings(forceSync); // Force refresh only if requested
      updateSyncTimestamp('settings');
      console.log('Synced business settings');
    } catch (error) {
      console.error('Error syncing business settings:', error);
      if (showToast) toast.error('Failed to sync business settings');
    }
    
    // Update last sync timestamp
    updateLastSyncTimestamp();
    
    if (showToast) toast.success('Data synchronized successfully');
    return true;
  } catch (error) {
    console.error('Error in syncData:', error);
    if (showToast) toast.error('Sync failed. Will retry later.');
    return false;
  }
};

// Start background sync with interval
let syncInterval: number | null = null;

export const startBackgroundSync = (): void => {
  // Clear any existing interval
  if (syncInterval) {
    window.clearInterval(syncInterval);
  }
  
  // Set new interval
  syncInterval = window.setInterval(() => {
    if (navigator.onLine && isSyncNeeded()) {
      console.log('Running background sync...');
      syncData(false).then((success) => {
        if (success) {
          console.log('Background sync completed successfully');
        } else {
          console.log('Background sync failed or wasn\'t needed');
        }
      });
    }
  }, SYNC_INTERVAL_MS);
  
  console.log('Background sync scheduled');
};

export const stopBackgroundSync = (): void => {
  if (syncInterval) {
    window.clearInterval(syncInterval);
    syncInterval = null;
    console.log('Background sync stopped');
  }
};
