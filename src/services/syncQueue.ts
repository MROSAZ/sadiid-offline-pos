
/**
 * Queue management system for offline operations that need to be synchronized
 * when the connection is restored.
 */
import { openDB } from 'idb';
import { toast } from 'sonner';
import { getLocalItemAsJson, setLocalItem } from './storage';

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
export const isSyncNeeded = (thresholdMinutes = 30): boolean => {
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
