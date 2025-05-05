import { fetchProducts, fetchContacts, createSale } from '@/services/api';
import { saveProducts, saveContacts, getUnSyncedSales, markSaleAsSynced } from '@/services/storage';
import { getBusinessSettings } from '@/services/businessSettings';
import { toast } from 'sonner';

export const syncOfflineSales = async (): Promise<boolean> => {
  try {
    const unSyncedSales = await getUnSyncedSales();
    console.log(`Found ${unSyncedSales.length} unsynced sales`);
    
    if (unSyncedSales.length === 0) {
      return true;
    }
    
    let syncedCount = 0;
    
    for (const sale of unSyncedSales) {
      try {
        // Extract local properties before sending to API
        const { local_id, is_synced, ...saleData } = sale;
        
        // Send to API
        await createSale(saleData);
        
        // Mark as synced
        await markSaleAsSynced(local_id);
        syncedCount++;
        console.log(`Synced sale ID: ${local_id}`);
      } catch (error) {
        console.error(`Error syncing sale ID ${sale.local_id}:`, error);
      }
    }
    
    console.log(`Successfully synced ${syncedCount}/${unSyncedSales.length} offline sales`);
    return true;
  } catch (error) {
    console.error('Error in syncOfflineSales:', error);
    return false;
  }
};

export const syncData = async (showToast = false): Promise<boolean> => {
  try {
    // Start with products
    try {
      const productsResponse = await fetchProducts(1, 1000); // Adjust limits as needed
      if (productsResponse.data) {
        await saveProducts(productsResponse.data);
        console.log(`Synced ${productsResponse.data.length} products`);
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      if (showToast) toast.error('Failed to sync products');
    }
    
    // Then sync contacts
    try {
      const contactsResponse = await fetchContacts(1, 1000); // Adjust limits as needed
      if (contactsResponse.data) {
        await saveContacts(contactsResponse.data);
        console.log(`Synced ${contactsResponse.data.length} contacts`);
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
      if (showToast) toast.error('Failed to sync contacts');
    }
    
    // Sync settings
    try {
      await getBusinessSettings(true); // Force refresh
      console.log('Synced business settings');
    } catch (error) {
      console.error('Error syncing business settings:', error);
      if (showToast) toast.error('Failed to sync business settings');
    }
    
    // Try to sync any offline sales
    try {
      await syncOfflineSales();
    } catch (error) {
      console.error('Error syncing offline sales:', error);
      if (showToast) toast.error('Failed to sync offline sales');
    }
    
    return true;
  } catch (error) {
    console.error('Error in syncData:', error);
    return false;
  }
};

// Additional sync-related functions...
