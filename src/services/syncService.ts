
import { fetchProducts, fetchContacts, createSale } from './api';
import { saveProducts, saveContacts, getUnSyncedSales, markSaleAsSynced, getProducts, getContacts } from './storage';
import { toast } from 'sonner';
import { withRetry, delay } from '../utils/apiUtils';

export const syncData = async () => {
  try {
    if (!navigator.onLine) {
      return { success: false, message: 'No internet connection' };
    }

    // Sync products
    const products = await syncProducts();
    
    // Sync contacts
    const contacts = await syncContacts();
    
    // Sync pending sales
    const sales = await syncPendingSales();
    
    // Update last sync timestamp
    localStorage.setItem('last_sync_timestamp', Date.now().toString());

    return {
      success: true,
      message: 'Sync completed successfully',
      data: { products, contacts, sales }
    };
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
};

export const syncProducts = async (forceSync = false) => {
  try {
    // Check if we already have products locally and aren't forcing a sync
    if (!forceSync) {
      const localProducts = await getProducts();
      if (localProducts && localProducts.length > 0) {
        console.log(`Using ${localProducts.length} local products, skipping sync`);
        return { success: true, count: localProducts.length, fromCache: true };
      }
    }
    
    let allProducts: any[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await withRetry(
        () => fetchProducts(page),
        3,
        2000 // 2 second initial delay
      );
      const { data, meta } = response;
      allProducts = [...allProducts, ...data];
      
      if (page >= meta.last_page) {
        hasMore = false;
      } else {
        page++;
        await delay(1000); // 1 second delay between requests
      }
    }
    
    await saveProducts(allProducts);
    return { success: true, count: allProducts.length };
  } catch (error) {
    console.error('Error syncing products:', error);
    toast.error('Failed to sync products');
    return { success: false, error };
  }
};

export const syncContacts = async (forceSync = false) => {
  try {
    // Check if we already have contacts locally and aren't forcing a sync
    if (!forceSync) {
      const localContacts = await getContacts();
      if (localContacts && localContacts.length > 0) {
        console.log(`Using ${localContacts.length} local contacts, skipping sync`);
        return { success: true, count: localContacts.length, fromCache: true };
      }
    }
    
    let allContacts: any[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await withRetry(
        () => fetchContacts(page),
        3,
        2000 // 2 second initial delay
      );
      const { data, meta } = response;
      allContacts = [...allContacts, ...data];
      
      if (page >= meta.last_page) {
        hasMore = false;
      } else {
        page++;
        await delay(1000); // 1 second delay between requests
      }
    }
    
    await saveContacts(allContacts);
    return { success: true, count: allContacts.length };
  } catch (error) {
    console.error('Error syncing contacts:', error);
    toast.error('Failed to sync contacts');
    return { success: false, error };
  }
};

export const syncPendingSales = async () => {
  try {
    const unSyncedSales = await getUnSyncedSales();
    
    if (unSyncedSales.length === 0) {
      return { success: true, count: 0 };
    }
    
    let syncedCount = 0;
    
    for (const sale of unSyncedSales) {
      try {
        // Remove local_id which is only for IndexedDB
        const { local_id, is_synced, ...saleData } = sale;
        
        // Send to server
        await createSale(saleData);
        
        // Mark as synced
        await markSaleAsSynced(local_id);
        
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync sale ${sale.local_id}:`, error);
      }
    }
    
    return { success: true, count: syncedCount, total: unSyncedSales.length };
  } catch (error) {
    console.error('Error syncing pending sales:', error);
    toast.error('Failed to sync pending sales');
    return { success: false, error };
  }
};
