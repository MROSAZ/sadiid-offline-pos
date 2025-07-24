/**
 * Background Sync Utilities
 * 
 * This module provides utilities for performing background operations
 * that don't block the UI in an offline-first application.
 */

type BackgroundTask = () => Promise<void>;

// Track queued background tasks to prevent duplicates
const queuedTasks = new Set<string>();

/**
 * Queue a background task with a unique identifier
 * Prevents duplicate tasks from being queued
 */
export const queueBackgroundTask = (
  taskId: string, 
  task: BackgroundTask, 
  delayMs: number = 100
): void => {
  if (queuedTasks.has(taskId)) {
    console.log(`Background task ${taskId} already queued`);
    return;
  }

  queuedTasks.add(taskId);

  setTimeout(async () => {
    try {
      console.log(`Executing background task: ${taskId}`);
      await task();
      console.log(`Background task completed: ${taskId}`);
    } catch (error) {
      console.log(`Background task failed (non-blocking): ${taskId}`, error);
    } finally {
      queuedTasks.delete(taskId);
    }
  }, delayMs);
};

/**
 * Common background task types for the application
 */
export const BackgroundTasks = {
  USER_REFRESH: 'user-refresh',
  BUSINESS_SETTINGS_REFRESH: 'business-settings-refresh',
  PRODUCTS_SYNC: 'products-sync',
  CUSTOMERS_SYNC: 'customers-sync',
  SALES_SYNC: 'sales-sync',
  QUEUE_PROCESSING: 'queue-processing'
} as const;

/**
 * Utility to safely perform background operations only when online
 */
export const performWhenOnline = (task: BackgroundTask): BackgroundTask => {
  return async () => {
    if (!navigator.onLine) {
      console.log('Skipping background task - device is offline');
      return;
    }
    await task();
  };
};
