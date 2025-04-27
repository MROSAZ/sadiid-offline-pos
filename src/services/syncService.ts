
import { fetchProducts, fetchContacts, createSale } from './api';
import { saveProducts, saveContacts, getUnSyncedSales, markSaleAsSynced } from './storage';
import { toast } from 'sonner';

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

export const syncProducts = async () => {
  try {
    let allProducts: any[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetchProducts(page);
      const { data, meta } = response;
      allProducts = [...allProducts, ...data];
      
      if (page >= meta.last_page) {
        hasMore = false;
      } else {
        page++;
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

export const syncContacts = async () => {
  try {
    let allContacts: any[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetchContacts(page);
      const { data, meta } = response;
      allContacts = [...allContacts, ...data];
      
      if (page >= meta.last_page) {
        hasMore = false;
      } else {
        page++;
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
