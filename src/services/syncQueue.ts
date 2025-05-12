import { v4 as uuidv4 } from 'uuid';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SyncQueueItem, SyncPriority, SyncStatus, SyncOperationType, RetryConfig, SyncEvent, SyncEntityType } from './types/sync';
import { networkManager } from './networkManager';
import api from './api';
import { toast } from 'sonner';
import { getDB, wrapWithVersion } from './storage';

/**
 * Database schema for the sync queue
 */
interface SyncQueueDB extends DBSchema {
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-status': SyncStatus;
      'by-priority': SyncPriority;
      'by-type': SyncOperationType;
      'by-entity': string;
    };
  };
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 300000, // 5 minutes
};

/**
 * SyncQueue service handles the queuing, persistence, and processing of sync operations.
 * It implements priority-based queue processing, exponential backoff for retries,
 * and emits events for progress tracking.
 */
export class SyncQueue {
  private async processQueue(): Promise<void> {
    if (!this.isInitialized || !this.db || this.processingQueue) {
      return;
    }

    // Check network status using the network manager
    if (!networkManager.isOnline()) {
      console.log('Cannot process sync queue: device is offline');
      return;
    }

    this.processingQueue = true;

    try {
      // Get all pending items sorted by priority
      const pendingItems = await this.getPendingItems();
      
      if (pendingItems.length > 0) {
        console.log(`Processing ${pendingItems.length} pending sync items`);
      }
      
      for (const item of pendingItems) {
        try {
          // Check if we're still online before each operation
          if (!networkManager.isOnline()) {
            console.log('Network connection lost, pausing sync queue processing');
            break;
          }
          
          // Update status to in progress
          await this.updateItemStatus(item.id, SyncStatus.IN_PROGRESS);
          this.emit
          switch (item.type) {
            case SyncOperationType.CREATE:
              await this.handleCreate(item);
              break;
            case SyncOperationType.UPDATE:
              await this.handleUpdate(item);
              break;
            case SyncOperationType.DELETE:
              await this.handleDelete(item);
              break;
            default:
              throw new Error(`Unknown operation type: ${item.type}`);
          }

          // Mark as completed
          await this.updateItemStatus(item.id, SyncStatus.COMPLETED);
          this.emit({ type: 'complete', data: { item } });
        } catch (error) {
        }, 30000); // Check every 30 seconds
      }
      
      // Process the queue immediately
      this.processQueue();
    } catch (error) {
      console.error('Failed to initialize sync queue:', error);
      throw error;
    }
  }

  /**
   * Process a single queue item
   */
  private async processItem(item: SyncQueueItem): Promise<void> {
    console.log(`Processing ${item.type} operation for ${item.entityType}`, item.data);
    
    switch (item.type) {
      case SyncOperationType.CREATE:
        await this.handleCreate(item);
        break;
      case SyncOperationType.UPDATE:
        await this.handleUpdate(item);
        break;
      case SyncOperationType.DELETE:
        await this.handleDelete(item);
        break;
      default:
        throw new Error(`Unknown operation type: ${item.type}`);
    }
  }
  
  /**
   * Handle create operations with API integration
   */
  private async handleCreate(item: SyncQueueItem): Promise<void> {
    if (!networkManager.isOnline()) {
      throw new Error('No network connection available');
    }

    try {
      let response;
      const { entityType, data } = item;
      
      switch (entityType) {
        case SyncEntityType.PRODUCT:
          response = await api.post('/connector/api/product', data);
          break;
          
        case SyncEntityType.CONTACT:
          response = await api.post('/connector/api/contactapi', data);
          break;
          
        case SyncEntityType.SALE:
          // The API expects sells as an array
          response = await api.post('/connector/api/sell', { sells: [data] });
          break;
          
        case SyncEntityType.BUSINESS_SETTING:
          response = await api.post('/connector/api/business-settings', data);
          break;
          
        default:
          throw new Error(`Unsupported entity type for creation: ${entityType}`);
      }

      // Extract data from the response
      const responseData = this.extractResponseData(response.data);
      
      // Update local data with server response
      await this.updateLocalData(entityType, responseData);
      
      // Provide user feedback
      toast.success(`Successfully created ${this.formatEntityName(entityType)}`);
      
      console.log(`Successfully created ${entityType}:`, responseData);
    } catch (error) {
      this.handleApiError(error, item, 'creating');
    }
  }

  /**
   * Handle update operations with API integration
   */
  private async handleUpdate(item: SyncQueueItem): Promise<void> {
    if (!networkManager.isOnline()) {
      throw new Error('No network connection available');
    }

    try {
      let response;
      const { entityType, data } = item;
      const id = data.id;
      
      if (!id) {
        throw new Error(`Cannot update ${entityType} without ID`);
      }
      
      switch (entityType) {
        case SyncEntityType.PRODUCT:
          response = await api.put(`/connector/api/product/${id}`, data);
          break;
          
        case SyncEntityType.CONTACT:
          response = await api.put(`/connector/api/contactapi/${id}`, data);
          break;
          
        case SyncEntityType.SALE:
          // The API expects sells as an array
          response = await api.put(`/connector/api/sell/${id}`, { sells: [data] });
          break;
          
        case SyncEntityType.BUSINESS_SETTING:
          response = await api.put('/connector/api/business-settings', data);
          break;
          
        default:
          throw new Error(`Unsupported entity type for update: ${entityType}`);
      }

      // Extract data from the response
      const responseData = this.extractResponseData(response.data);
      
      // Update local data with server response
      await this.updateLocalData(entityType, responseData);
      
      // Provide user feedback
      toast.success(`Successfully updated ${this.formatEntityName(entityType)}`);
      
      console.log(`Successfully updated ${entityType}:`, responseData);
    } catch (error) {
      this.handleApiError(error, item, 'updating');
    }
  }

  /**
   * Handle delete operations with API integration
   */
  private async handleDelete(item: SyncQueueItem): Promise<void> {
    if (!networkManager.isOnline()) {
      throw new Error('No network connection available');
    }

    try {
      let response;
      const { entityType, data } = item;
      const id = data.id;
      
      if (!id) {
        throw new Error(`Cannot delete ${entityType} without ID`);
      }
      
      switch (entityType) {
        case SyncEntityType.PRODUCT:
          response = await api.delete(`/connector/api/product/${id}`);
          break;
          
        case SyncEntityType.CONTACT:
          response = await api.delete(`/connector/api/contactapi/${id}`);
          break;
          
        case SyncEntityType.SALE:
          response = await api.delete(`/connector/api/sell/${id}`);
          break;
          
        default:
          throw new Error(`Unsupported entity type for deletion: ${entityType}`);
      }

      // Remove item from local storage
      await this.removeLocalData(entityType, id);
      
      // Provide user feedback
      toast.success(`Successfully deleted ${this.formatEntityName(entityType)}`);
      
      console.log(`Successfully deleted ${entityType} with ID ${id}`);
    } catch (error) {
      this.handleApiError(error, item, 'deleting');
    }
  }
  
  /**
   * Extract response data from API response
   */
  private extractResponseData(responseData: any): any {
    // Different APIs might return data in different formats
    if (responseData?.data) {
      return Array.isArray(responseData.data) ? responseData.data[0] : responseData.data;
    } else if (Array.isArray(responseData)) {
      return responseData[0];
    } else {
      return responseData;
    }
  }
  
  /**
   * Update local data with server response
   */
  private async updateLocalData(entityType: string | SyncEntityType, data: any): Promise<void> {
    if (!data || !data.id) {
      console.error('Cannot update local data: Invalid data or missing ID', data);
      return;
    }
    
    try {
      const db = await getDB();
      let storeName: string;
      
      // Map entity type to store name
      switch (entityType) {
        case SyncEntityType.PRODUCT:
          storeName = 'products';
          break;
        case SyncEntityType.CONTACT:
          storeName = 'contacts';
          break;
        case SyncEntityType.SALE:
          storeName = 'sales';
          break;
        case SyncEntityType.BUSINESS_SETTING:
          storeName = 'settings';
          break;
        default:
          storeName = String(entityType).toLowerCase();
      }
      
      // Create versioned data wrapper
      const timestamp = Date.now();
      const versionedData = wrapWithVersion(
        data,
        data.id,
        data.version || 1
      );
      
      versionedData.syncStatus = SyncStatus.COMPLETED;
      versionedData.syncedAt = timestamp;
      
      // Save to IndexedDB
      await db.put(storeName, versionedData);
      
      console.log(`Updated local ${storeName} with synced data:`, data.id);
    } catch (error) {
      console.error(`Error updating local data for ${entityType}:`, error);
      throw error;
    }
  }
  
  /**
   * Remove local data after successful delete
   */
  private async removeLocalData(entityType: string | SyncEntityType, id: string | number): Promise<void> {
    try {
      const db = await getDB();
      let storeName: string;
      
      // Map entity type to store name
      switch (entityType) {
        case SyncEntityType.PRODUCT:
          storeName = 'products';
          break;
        case SyncEntityType.CONTACT:
          storeName = 'contacts';
          break;
        case SyncEntityType.SALE:
          storeName = 'sales';
          break;
        case SyncEntityType.BUSINESS_SETTING:
          storeName = 'settings';
          break;
        default:
          storeName = String(entityType).toLowerCase();
      }
      
      // Delete from IndexedDB
      await db.delete(storeName, id);
      
      console.log(`Removed ${storeName} with ID ${id} from local storage`);
    } catch (error) {
      console.error(`Error removing ${entityType} with ID ${id} from local storage:`, error);
      throw error;
    }
  }
  
  /**
   * Handle API errors
   */
  private handleApiError(error: any, item: SyncQueueItem, operation: string): never {
    // Check if it's a network error
    const isNetworkError = 
      !networkManager.isOnline() || 
      error.isOffline === true || 
      error.message?.includes('network') ||
      error.code === 'ECONNABORTED' ||
      error.name === 'NetworkError';
    
    // Get meaningful error message
    const errorMessage = error.response?.data?.message || error.message || `Error ${operation} ${item.entityType}`;
    
    console.error(`API Error ${operation} ${item.entityType}:`, error);
    
    if (isNetworkError) {
      toast.error(`Network error while ${operation} ${this.formatEntityName(item.entityType)}`, {
        description: 'Will retry when connection is restored'
      });
      throw new Error(`Network connection lost while ${operation} ${item.entityType}`);
    } else {
      toast.error(`Error ${operation} ${this.formatEntityName(item.entityType)}`, {
        description: errorMessage.substring(0, 100) // Limit description length
      });
      throw new Error(errorMessage);
    }
  }
  
  /**
   * Format entity name for user-friendly display
   */
  private formatEntityName(entityType: string | SyncEntityType): string {
    const name = String(entityType).toLowerCase();
    
    switch (name) {
      case 'product':
        return 'product';
      case 'contact':
        return 'contact';
      case 'sale':
        return 'sale';
      case 'business_setting':
        return 'business settings';
      default:
        return name.replace('_', ' ');
    }
  }
  
  /**
   * Retry a single failed item
   */
  private async retrySingleItem(id: string): Promise<void> {
    if (!this.db) return;
    
    try {
      const item = await this.db.get('syncQueue', id);
      
      if (item) {
        await this.db.put('syncQueue', {
          ...item,
          status: SyncStatus.PENDING,
          retryCount: 0,
          error: undefined,
          updatedAt: Date.now(),
        });
        
        toast.info(`Retrying ${this.formatEntityName(item.entityType)} sync operation`);
        
        // Process the queue after a short delay
        setTimeout(() => this.processQueue(), 100);
      }
    } catch (error) {
      console.error('Error retrying sync item:', error);
      toast.error('Failed to retry operation');
    }
  }
      error.isOffline === true ||
      errorMessage.includes('Network') ||
      errorMessage.includes('network') ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout');
    
    // Determine if we should retry
    const shouldRetry = item.retryCount < this.retryConfig.maxRetries;
    
    // If it's a network error or we should retry
    if (isNetworkError || shouldRetry) {
      const nextRetryDelay = this.calculateRetryDelay(item.retryCount);
      
      // Update item with retry information
      // For network errors, don't increase retry count
      await this.db.put('syncQueue', {
        ...item,
        status: SyncStatus.PENDING,
        retryCount: isNetworkError ? item.retryCount : item.retryCount + 1,
        lastAttempt: Date.now(),
        error: errorMessage,
        updatedAt: Date.now(),
      });

      this.emit({ 
        type: 'error', 
        data: { 
          item, 
          error: errorMessage, 
          willRetry: true, 
          nextRetryDelay,
          isNetworkError
        } 
      });
      
      // If it's a network error, show a special toast
      if (isNetworkError) {
        toast.error(`Network error - will retry when online`, {
          description: `Failed to ${item.type.toLowerCase()} ${item.entityType}`
        });
      } else {
        toast.error(`Error - will retry in ${Math.round(nextRetryDelay/1000)}s`, {
          description: errorMessage.substring(0, 100) // Limit description length
        });
      }
    } else {
      // Mark as failed if max retries reached
      await this.db.put('syncQueue', {
        ...item,
        status: SyncStatus.FAILED,
        error: errorMessage,
        updatedAt: Date.now(),
      });

      this.emit({ 
        type: 'error', 
        data: { 
          item, 
          error: errorMessage, 
          willRetry: false 
        } 
      });
      
      // Show error toast for failed sync
      toast.error(`Failed to ${item.type.toLowerCase()} ${item.entityType}`, {
        description: `Max retries exceeded: ${errorMessage.substring(0, 100)}`,
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => this.retrySingleItem(item.id)
        }
      });
    }
      // Get all pending items sorted by priority
      const pendingItems = await this.getPendingItems();
      
      for (const item of pendingItems) {
        try {
          // Check if we're still online
          if (!navigator.onLine) {
            break;
          }
          
          // Update status to in progress
          await this.updateItemStatus(item.id, SyncStatus.IN_PROGRESS);
          this.emit({ type: 'progress', data: { action: 'processing', item } });

          // Process the item based on type
          await this.processItem(item);

          // Mark as completed
          await this.updateItemStatus(item.id, SyncStatus.COMPLETED);
          this.emit({ type: 'complete', data: { item } });
        } catch (error) {
          await this.handleError(item, error);
        }
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Get pending items sorted by priority
   */
  private async getPendingItems(): Promise<SyncQueueItem[]> {
    if (!this.db) return [];

    const tx = this.db.transaction('syncQueue', 'readonly');
    const index = tx.store.index('by-status');
    
    // Get all pending items
    const pendingItems = await index.getAll(SyncStatus.PENDING);
    
    // Sort by priority and retry count
    return pendingItems.sort((a, b) => {
      // First by priority (high to low)
      if (a.priority !== b.priority) {
        return this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
      }
      
      // Then by retry count (low to high)
      if (a.retryCount !== b.retryCount) {
        return a.retryCount - b.retryCount;
      }
      
      // Finally by creation time (oldest first)
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * Process a single queue item
   */
  private async processItem(item: SyncQueueItem): Promise<void> {
    // For now, we'll just log the processing
    // In the next phase, we'll integrate with the API service to actually perform the sync
    console.log(`Processing ${item.type} operation for ${item.entityType}`, item.data);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Handle error when processing an item
   */
  private async handleError(item: SyncQueueItem, error: any): Promise<void> {
    if (!this.db) return;

    const errorMessage = error instanceof Error ? error.message : String(error);
    const shouldRetry = item.retryCount < this.retryConfig.maxRetries;

    if (shouldRetry) {
      const nextRetryDelay = this.calculateRetryDelay(item.retryCount);
      
      // Update item with retry information
      await this.db.put('syncQueue', {
        ...item,
        status: SyncStatus.PENDING,
        retryCount: item.retryCount + 1,
        lastAttempt: Date.now(),
        error: errorMessage,
        updatedAt: Date.now(),
      });

      this.emit({ 
        type: 'error', 
        data: { 
          item, 
          error: errorMessage, 
          willRetry: true, 
          nextRetryDelay 
        } 
      });
    } else {
      // Mark as failed if max retries reached
      await this.db.put('syncQueue', {
        ...item,
        status: SyncStatus.FAILED,
        error: errorMessage,
        updatedAt: Date.now(),
      });

      this.emit({ 
        type: 'error', 
        data: { 
          item, 
          error: errorMessage, 
          willRetry: false 
        } 
      });
    }
  }

  /**
   * Calculate delay for exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, retryCount),
      this.retryConfig.maxDelay
    );
    
    // Add jitter (±10%) to prevent thundering herd problem
    const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
    
    return exponentialDelay + jitter;
  }

  /**
   * Update the status of a queue item
   */
  private async updateItemStatus(id: string, status: SyncStatus): Promise<void> {
    if (!this.db) return;

    const item = await this.db.get('syncQueue', id);
    if (item) {
      await this.db.put('syncQueue', {
        ...item,
        status,
        updatedAt: Date.now(),
      });
    }
  }

  /**
   * Get numerical weight for priority comparison
   */
  private getPriorityWeight(priority: SyncPriority): number {
    switch (priority) {
      case SyncPriority.HIGH:
        return 3;
      case SyncPriority.MEDIUM:
        return 2;
      case SyncPriority.LOW:
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Event handling
   */
  public addEventListener(listener: (event: SyncEvent) => void): void {
    this.listeners.push(listener);
  }

  public removeEventListener(listener: (event: SyncEvent) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private emit(event: SyncEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in sync event listener:', error);
      }
    });
  }

  /**
   * Queue management methods
   */
  public async getQueueStats(): Promise<{
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    if (!this.db) {
      return { pending: 0, inProgress: 0, completed: 0, failed: 0, total: 0 };
    }

    const tx = this.db.transaction('syncQueue', 'readonly');
    const index = tx.store.index('by-status');

    const [pending, inProgress, completed, failed, total] = await Promise.all([
      index.count(SyncStatus.PENDING),
      index.count(SyncStatus.IN_PROGRESS),
      index.count(SyncStatus.COMPLETED),
      index.count(SyncStatus.FAILED),
      tx.store.count()
    ]);

    return {
      pending,
      inProgress,
      completed,
      failed,
      total
    };
  }

  /**
   * Clear completed items from the queue
   */
  public async clearCompleted(): Promise<number> {
    if (!this.db) return 0;

    const tx = this.db.transaction('syncQueue', 'readwrite');
    const index = tx.store.index('by-status');
    const completedKeys = await index.getAllKeys(SyncStatus.COMPLETED);
    
    for (const key of completedKeys) {
      await tx.store.delete(key);
    }

    return completedKeys.length;
  }

  /**
   * Reset failed items to pending state
   */
  public async retryFailed(): Promise<number> {
    if (!this.db) return 0;

    const tx = this.db.transaction('syncQueue', 'readwrite');
    const index = tx.store.index('by-status');
    const failedItems = await index.getAll(SyncStatus.FAILED);

    for (const item of failedItems) {
      await tx.store.put({
        ...item,
        status: SyncStatus.PENDING,
        retryCount: 0,
        error: undefined,
        updatedAt: Date.now(),
      });
    }

    if (failedItems.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }

    return

