/**
 * Queue management system for offline operations that need to be synchronized
 * when the connection is restored.
 */
import { openDB } from 'idb';
import { toast } from 'sonner';
import { getLocalItemAsJson, setLocalItem } from '@/lib/storage';
import { createSale, updateSale, createContact } from './api';
import { updateSaleWithSyncedData, markSaleAsSyncFailed } from '@/lib/storage';

// Define operation types that can be queued
export type QueueableOperationType = 'sale' | 'customer' | 'attendance';

export interface QueuedOperation {
  id: string;
  type: QueueableOperationType;
  data: any;
  createdAt: string;
  attempts: number;
  lastAttempt?: string;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
}

// DB name for operations queue
const QUEUE_DB_NAME = 'sadiid-sync-queue';
const QUEUE_STORE_NAME = 'operations';
const LAST_SYNC_KEY = 'last_sync_timestamp';
const MAX_RETRY_ATTEMPTS = 5;

// Initialize IndexedDB for sync queue
export const initSyncQueueDB = async () => {
  return openDB(QUEUE_DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
        const store = db.createObjectStore(QUEUE_STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-status', 'status');
        store.createIndex('by-type', 'type');
        store.createIndex('by-created', 'createdAt');
      }
    },
  });
};

// Add an operation to the queue
export const queueOperation = async (type: QueueableOperationType, data: any): Promise<string> => {
  const db = await initSyncQueueDB();
  const id = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  const operation: QueuedOperation = {
    id,
    type,
    data,
    createdAt: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
  };
  
  await db.put(QUEUE_STORE_NAME, operation);
  return id;
};

// Get operations by status
export const getOperationsByStatus = async (status: QueuedOperation['status']): Promise<QueuedOperation[]> => {
  const db = await initSyncQueueDB();
  return db.getAllFromIndex(QUEUE_STORE_NAME, 'by-status', status);
};

// Get operations by type
export const getOperationsByType = async (type: QueueableOperationType): Promise<QueuedOperation[]> => {
  const db = await initSyncQueueDB();
  return db.getAllFromIndex(QUEUE_STORE_NAME, 'by-type', type);
};

// Update operation status
export const updateOperationStatus = async (
  id: string, 
  status: QueuedOperation['status'],
  error?: string
): Promise<void> => {
  const db = await initSyncQueueDB();
  const operation = await db.get(QUEUE_STORE_NAME, id);
  
  if (operation) {
    operation.status = status;
    if (status === 'processing') {
      operation.attempts += 1;
      operation.lastAttempt = new Date().toISOString();
    }
    if (error) {
      operation.error = error;
    }
    await db.put(QUEUE_STORE_NAME, operation);
  }
};

// Delete completed operations older than specified days
export const cleanupCompletedOperations = async (olderThanDays = 7): Promise<number> => {
  const db = await initSyncQueueDB();
  const completed = await getOperationsByStatus('completed');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  let deleted = 0;
  for (const operation of completed) {
    const createdAt = new Date(operation.createdAt);
    if (createdAt < cutoffDate) {
      await db.delete(QUEUE_STORE_NAME, operation.id);
      deleted++;
    }
  }
  
  return deleted;
};

// Get the timestamp of the last successful sync
export const getLastSyncTimestamp = (): number => {
  return getLocalItemAsJson<number>(LAST_SYNC_KEY) || 0;
};

// Update the last sync timestamp
export const updateLastSyncTimestamp = (): void => {
  setLocalItem(LAST_SYNC_KEY, JSON.stringify(Date.now()));
};

// Check if sync is needed based on elapsed time
export const isSyncNeeded = (thresholdMinutes = 1): boolean => {
  const lastSync = getLastSyncTimestamp();
  if (!lastSync) return true;
  
  const thresholdMs = thresholdMinutes * 60 * 1000;
  return Date.now() - lastSync > thresholdMs;
};

// Delete an operation
export const deleteOperation = async (id: string): Promise<void> => {
  const db = await initSyncQueueDB();
  await db.delete(QUEUE_STORE_NAME, id);
};

// Get queue stats
export const getQueueStats = async (): Promise<{
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  total: number;
}> => {
  const db = await initSyncQueueDB();
  const operations = await db.getAll(QUEUE_STORE_NAME);
  
  const stats = {
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
    total: operations.length,
  };
  
  operations.forEach((op) => {
    stats[op.status as keyof typeof stats]++;
  });
  
  return stats;
};

// Process the queue - sync pending operations when online
export const processQueue = async (): Promise<void> => {
  if (!navigator.onLine) {
    console.log('Device offline, skipping queue processing');
    return;
  }
  
  try {
    const pendingOps = await getOperationsByStatus('pending');
    
    if (pendingOps.length === 0) {
      console.log('No pending operations to process');
      return;
    }
    
    console.log(`Processing ${pendingOps.length} pending operations`);
    
    for (const operation of pendingOps) {
      try {
        await updateOperationStatus(operation.id, 'processing');
        
        switch (operation.type) {
          case 'sale':
            await processSaleOperation(operation);
            break;
          case 'customer':
            await processCustomerOperation(operation);
            break;
          case 'attendance':
            await processAttendanceOperation(operation);
            break;
          default:
            console.warn(`Unknown operation type: ${operation.type}`);
            await updateOperationStatus(operation.id, 'failed', 'Unknown operation type');
        }
      } catch (error: any) {
        console.error(`Failed to process operation ${operation.id}:`, error);
        await updateOperationStatus(operation.id, 'failed', error.message || 'Processing failed');
      }
    }
  } catch (error) {
    console.error('Error processing queue:', error);
  }
};

// Process sale operation
const processSaleOperation = async (operation: QueuedOperation): Promise<void> => {
  const localSaleId = operation.data.local_id;
  try {
    // Extract sale data - handle both nested and direct formats
    const saleData = operation.data.saleData || operation.data;
    const operationType = operation.data.operation_type || 'create'; // Default to create for backward compatibility
    const saleId = operation.data.sale_id; // For update operations
    
    let saleResponse;
    
    if (operationType === 'update' && saleId) {
      // Update existing sale via API
      console.log(`🔄 Updating sale with ID: ${saleId}`);
      saleResponse = await updateSale(saleId, saleData);
    } else {
      // Create new sale via API
      console.log(`🆕 Creating new sale with local_id: ${localSaleId}`);
      saleResponse = await createSale(saleData);
    }
    
    if (saleResponse.success && saleResponse.data) {
      // Extract the synced sale data from API response (could be array or single object)
      let syncedSaleData = saleResponse.data;
      
      // If data is an array, take the first element
      if (Array.isArray(syncedSaleData) && syncedSaleData.length > 0) {
        syncedSaleData = syncedSaleData[0];
      }
      
      // Store the complete API response data in IndexedDB for future use (receipts, etc.)
      await updateSaleWithSyncedData(localSaleId, syncedSaleData);
      await updateOperationStatus(operation.id, 'completed');
      console.log(`✅ Sale with local_id ${localSaleId} ${operationType === 'update' ? 'updated' : 'created'} successfully and synced locally.`);
    } else {
      const errorMsg = saleResponse.error || `Sync failed: API did not return sale data for ${operationType}`;
      await updateOperationStatus(operation.id, 'failed', errorMsg);
      await markSaleAsSyncFailed(localSaleId, errorMsg);
      console.error(`❌ Sale ${operationType} failed: ${errorMsg}`);
    }
  } catch (error: any) {
    console.error(`❌ Failed to ${operation.data.operation_type || 'create'} sale with local_id ${localSaleId}:`, error);
    
    // Extract meaningful error message
    let errorMessage = 'Unknown error';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    await updateOperationStatus(operation.id, 'failed', errorMessage);
    await markSaleAsSyncFailed(localSaleId, errorMessage);
  }
};

// Process customer operation
const processCustomerOperation = async (operation: QueuedOperation): Promise<void> => {
  const { createContact } = await import('@/services/api');
  
  try {
    const customerData = operation.data;
    const response = await createContact(customerData);
    
    if (response.success) {
      await updateOperationStatus(operation.id, 'completed');
      console.log(`Successfully synced customer: ${customerData.name}`);
    } else {
      throw new Error(response.message || 'Customer sync failed');
    }
  } catch (error: any) {
    throw new Error(`Customer sync failed: ${error.message}`);
  }
};

// Process attendance operation
const processAttendanceOperation = async (operation: QueuedOperation): Promise<void> => {
  // TODO: Implement attendance sync when attendance API is available
  console.log('Attendance sync not yet implemented');
  await updateOperationStatus(operation.id, 'failed', 'Attendance sync not implemented');
};
