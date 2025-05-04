import { fetchProducts as getProductsFromApi } from './api';
import { fetchContacts as getContactsFromApi } from './api';
import { saveProducts, saveContacts, getProducts as getProductsFromStorage, getContacts as getContactsFromStorage } from './storage';
import { toast } from 'sonner';

export const syncProducts = async (forceRefresh = false): Promise<any[]> => {
  try {
    // First try to get from storage
    const productsFromStorage = await getProductsFromStorage();
    
    // If we have products in storage and not forcing refresh, return them
    if (productsFromStorage && productsFromStorage.length > 0 && !forceRefresh) {
      return productsFromStorage;
    }
    
    // Otherwise fetch from API and save to storage
    const products = await getProductsFromApi();
    if (products && products.length > 0) {
      await saveProducts(products);
    }
    return products;
  } catch (error) {
    console.error('Error syncing products:', error);
    
    // If API fails, try to get from storage as fallback
    const productsFromStorage = await getProductsFromStorage();
    if (productsFromStorage && productsFromStorage.length > 0) {
      return productsFromStorage;
    }
    
    throw error;
  }
};

export const syncContacts = async (forceRefresh = false): Promise<any[]> => {
  try {
    // First try to get from storage
    const contactsFromStorage = await getContactsFromStorage();
    
    // If we have contacts in storage and not forcing refresh, return them
    if (contactsFromStorage && contactsFromStorage.length > 0 && !forceRefresh) {
      return contactsFromStorage;
    }
    
    // Otherwise fetch from API and save to storage
    const contacts = await getContactsFromApi();
    if (contacts && contacts.length > 0) {
      await saveContacts(contacts);
    }
    return contacts;
  } catch (error) {
    console.error('Error syncing contacts:', error);
    
    // If API fails, try to get from storage as fallback
    const contactsFromStorage = await getContactsFromStorage();
    if (contactsFromStorage && contactsFromStorage.length > 0) {
      return contactsFromStorage;
    }
    
    throw error;
  }
};

export const syncData = async (showToast = true): Promise<void> => {
  try {
    if (showToast) toast.loading('Syncing data...');
    await Promise.all([
      syncProducts(true),
      syncContacts(true)
    ]);
    if (showToast) toast.success('Data synced successfully');
  } catch (error) {
    console.error('Error syncing data:', error);
    if (showToast) toast.error('Failed to sync data');
  }
};
