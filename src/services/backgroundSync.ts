import { syncData } from './syncService';

// Track if background sync is in progress
let isSyncInProgress = false;

/**
 * Interval between background syncs (in milliseconds)
 * Default: 5 minutes (300000ms)
 */
const SYNC_INTERVAL = 5 * 60 * 1000;

// Reference to the interval timer
let syncIntervalId: number | null = null;

/**
 * Start background sync service that periodically syncs data
 * when online
 */
export const startBackgroundSync = () => {
  // Don't create multiple intervals
  if (syncIntervalId !== null) {
    return;
  }

  console.log('Starting background sync service...');

  // Initial sync
  triggerBackgroundSync();

  // Set up regular sync interval
  syncIntervalId = window.setInterval(() => {
    triggerBackgroundSync();
  }, SYNC_INTERVAL);
};

/**
 * Stop background sync service
 */
export const stopBackgroundSync = () => {
  if (syncIntervalId !== null) {
    window.clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log('Background sync service stopped');
  }
};

/**
 * Trigger a background sync if online and not already syncing
 * Returns true if sync was triggered, false otherwise
 */
export const triggerBackgroundSync = async (): Promise<boolean> => {
  // Don't sync if offline or sync already in progress
  if (!navigator.onLine || isSyncInProgress) {
    return false;
  }

  try {
    isSyncInProgress = true;
    console.log('Background sync started');
    await syncData(false); // Don't show toasts for background syncs
    console.log('Background sync completed');
    return true;
  } catch (error) {
    console.error('Background sync failed:', error);
    return false;
  } finally {
    isSyncInProgress = false;
  }
};

/**
 * Run sync immediately and show notification
 * For manual user-triggered sync
 */
export const manualSync = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    console.warn('Cannot sync while offline');
    return false;
  }

  if (isSyncInProgress) {
    console.warn('Sync already in progress');
    return false;
  }

  try {
    isSyncInProgress = true;
    await syncData(true); // Show toasts for manual sync
    return true;
  } catch (error) {
    console.error('Manual sync failed:', error);
    return false;
  } finally {
    isSyncInProgress = false;
  }
};
