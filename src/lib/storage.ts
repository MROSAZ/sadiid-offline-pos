import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SadiidPOSDB extends DBSchema {
  token: {
    key: string;
    value: {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token?: string;
    };
  };
  products: {
    key: string;
    value: any;
    indexes: { 'by-name': string; 'by-category': number };
  };
  contacts: {
    key: string;
    value: any;
    indexes: { 'by-name': string };
  };
  sales: {
    key: number; // For autoIncrement
    value: any;
    indexes: { 'by-date': string; 'by-sync': number };
  };
  user: {
    key: string;
    value: any;
  };
  business_settings: {
    key: string;
    value: any;
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
}

const DB_NAME = 'sadiid-pos';
const DB_VERSION = 1;

let db: IDBPDatabase<SadiidPOSDB>;

// Initialize database with better error handling
export const initDB = async () => {
  try {
    if (db) return db;
    
    db = await openDB<SadiidPOSDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('token')) {
          db.createObjectStore('token');
        }
        
        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user');
        }
        
        if (!db.objectStoreNames.contains('business_settings')) {
          db.createObjectStore('business_settings');
        }
        
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by-name', 'name');
          productStore.createIndex('by-category', 'category.id');
        }
        
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { keyPath: 'id' });
          contactStore.createIndex('by-name', 'name');
        }
        
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { 
            keyPath: 'local_id',
            autoIncrement: true 
          });
          salesStore.createIndex('by-date', 'transaction_date');
          salesStore.createIndex('by-sync', 'is_synced');
        }
        
        // Add settings store for location and other app settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
    
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Helper to get database instance
export const getDB = async () => {
  if (!db) {
    await initDB();
  }
  return db;
};

// Token management
export const saveToken = async (tokenData: any) => {
  try {
    console.log('💾 Storage: Saving token...', !!tokenData);
    localStorage.setItem('auth_token', JSON.stringify(tokenData));
    console.log('💾 Storage: Token saved to localStorage');
    
    const db = await getDB();
    await db.put('token', tokenData, 'auth_token');
    console.log('✅ Storage: Token saved to IndexedDB');
    return true;
  } catch (error) {
    console.error('❌ Storage: Error saving token:', error);
    throw error;
  }
};

export const getToken = () => {
  try {
    const tokenString = localStorage.getItem('auth_token');
    if (tokenString) {
      return JSON.parse(tokenString);
    }
    return null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = () => {
  try {
    localStorage.removeItem('auth_token');
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};

// User management
export const saveUser = async (user: any) => {
  try {
    console.log('💾 Storage: Saving user...', user?.name || user?.email || 'unknown');
    const db = await getDB();
    await db.put('user', user, 'current_user');
    console.log('✅ Storage: User saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Storage: Error saving user:', error);
    throw error;
  }
};

export const getUser = async () => {
  try {
    const db = await getDB();
    return db.get('user', 'current_user');
  } catch (error) {
    console.error('Error getting user from IndexedDB:', error);
    return null;
  }
};

// Product management
export const saveProducts = async (products: any[]) => {
  try {
    console.log('💾 Storage: saveProducts called with:', products.length, 'products');
    console.log('💾 Storage: Sample products:', products.slice(0, 2));
    
    const db = await getDB();
    const tx = db.transaction('products', 'readwrite');
    
    // Clear existing products first
    await tx.store.clear();
    
    for (const product of products) {
      // Ensure each product has an id (keyPath requirement)
      if (!product.id) {
        product.id = product.product_id || `product_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
      await tx.store.put(product);
    }
    
    await tx.done;
    console.log('✅ Storage: Products saved successfully to IndexedDB');
    
    // Verify data was saved
    const savedProducts = await getProducts();
    console.log('✅ Storage: Verification - Products in DB after save:', savedProducts.length);
    
    return true;
  } catch (error) {
    console.error('❌ Storage: Error saving products:', error);
    throw error;
  }
};

export const getProducts = async () => {
  const db = await getDB();
  return db.getAll('products');
};

// Get product categories
export const getCategories = async (): Promise<any[]> => {
  try {
    const products = await getProducts();
    
    // Extract unique categories from products
    const categoriesMap = new Map();
    
    products.forEach(product => {
      if (product.category) {
        categoriesMap.set(product.category.id, product.category);
      }
    });
    
    // Convert map values to array and sort by name
    const categories = Array.from(categoriesMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return categories;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

// Optimize product filtering by category
export const getProductsByCategory = async (categoryId: number): Promise<any[]> => {
  const db = await getDB();
  if (!categoryId) {
    return db.getAll('products');
  }
  return db.getAllFromIndex('products', 'by-category', categoryId);
};

// Contact management
export const saveContacts = async (contacts: any[]) => {
  try {
    console.log('💾 Storage: saveContacts called with:', contacts.length, 'contacts');
    console.log('💾 Storage: Sample contacts:', contacts.slice(0, 2));
    
    const db = await getDB();
    const tx = db.transaction('contacts', 'readwrite');
    
    // Clear existing contacts first
    await tx.store.clear();
    
    for (const contact of contacts) {
      // Ensure each contact has an id (keyPath requirement)
      if (!contact.id) {
        contact.id = contact.contact_id || `contact_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
      await tx.store.put(contact);
    }
    
    await tx.done;
    console.log('✅ Storage: Contacts saved successfully to IndexedDB');
    
    // Verify data was saved
    const savedContacts = await getContacts();
    console.log('✅ Storage: Verification - Contacts in DB after save:', savedContacts.length);
    
    return true;
  } catch (error) {
    console.error('❌ Storage: Error saving contacts:', error);
    throw error;
  }
};

export const getContacts = async () => {
  const db = await getDB();
  return db.getAll('contacts');
};

export const saveContact = async (contact: any) => {
  const db = await getDB();
  // Generate local ID if not provided
  if (!contact.id) {
    contact.local_id = `contact_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  contact.is_synced = 0; // Mark as unsynced
  const id = await db.add('contacts', contact);
  return id;
};

// Sales management
export const saveSale = async (sale: any) => {
  const db = await getDB();
  // Always mark as not synced for offline-first approach
  sale.is_synced = 0;
  sale.transaction_date = new Date().toISOString();
  sale.local_id = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const id = await db.add('sales', sale);
  return id;
};

export const getUnSyncedSales = async () => {
  const db = await getDB();
  return db.getAllFromIndex('sales', 'by-sync', 0);
};

export const markSaleAsSynced = async (id: number | string): Promise<boolean> => {
  try {
    const db = await getDB();
    const tx = db.transaction('sales', 'readwrite');
    
    // If ID is numeric, try to get sale directly
    let sale = null;
    if (typeof id === 'number') {
      sale = await tx.store.get(id);
    }
    
    // If not found or ID is a string, search through all sales
    if (!sale) {
      const allSales = await tx.store.getAll();
      sale = allSales.find(s => 
        s.local_id === id || 
        s.id === id || 
        s.local_id === id.toString() || 
        s.id === id.toString()
      );
    }
    
    if (sale) {
      sale.is_synced = 1;
      await tx.store.put(sale);
      await tx.done;
      return true;
    }
  } catch (error) {
    console.error('Error marking sale as synced:', error);
  }
  return false;
};

export const updateSaleWithSyncedData = async (localId: number | string, syncedData: any): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('sales', 'readwrite');
  
  // Get all sales and find the one with matching local_id
  const allSales = await tx.store.getAll();
  const sale = allSales.find(s => 
    s.local_id === localId || 
    s.id === localId || 
    s.local_id === localId.toString() || 
    s.id === localId.toString()
  );
  
  if (sale) {
    const updatedSale = { ...sale, ...syncedData, is_synced: 1, sync_error: null };
    await tx.store.put(updatedSale);
    console.log(`Sale ${localId} updated with synced data.`);
  } else {
    console.warn(`Sale with local_id ${localId} not found for updating.`);
  }
  await tx.done;
};

export const markSaleAsSyncFailed = async (localId: number | string, error: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('sales', 'readwrite');
  
  // Get all sales and find the one with matching local_id
  const allSales = await tx.store.getAll();
  const sale = allSales.find(s => 
    s.local_id === localId || 
    s.id === localId || 
    s.local_id === localId.toString() || 
    s.id === localId.toString()
  );
  
  if (sale) {
    sale.is_synced = 0; // Keep it as unsynced
    sale.sync_error = error;
    await tx.store.put(sale);
    console.log(`Sale ${localId} marked as sync failed.`);
  } else {
    console.warn(`Sale with local_id ${localId} not found for marking as failed.`);
  }
  await tx.done;
};

export const getSales = async (page = 1, limit = 20) => {
  const db = await getDB();
  const allSales = await db.getAll('sales');
  
  // Sort by date, newest first
  allSales.sort((a, b) => 
    new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  );
  
  // Paginate
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    data: allSales.slice(start, end),
    total: allSales.length,
    page,
    limit,
    totalPages: Math.ceil(allSales.length / limit)
  };
};

// Get sale by ID (local_id or id)
export const getSaleById = async (saleId: string | number): Promise<any | null> => {
  try {
    const db = await getDB();
    const allSales = await db.getAll('sales');
    
    // Try to find by local_id first, then by id
    const sale = allSales.find(s => 
      s.local_id === saleId || 
      s.id === saleId || 
      s.local_id === saleId.toString() || 
      s.id === saleId.toString()
    );
    
    return sale || null;
  } catch (error) {
    console.error('Error getting sale by ID:', error);
    return null;
  }
};

// Update sale data (for editing)
export const updateSale = async (saleId: string | number, updatedData: any): Promise<boolean> => {
  try {
    const db = await getDB();
    const tx = db.transaction('sales', 'readwrite');
    const allSales = await tx.store.getAll();
    
    // Find the sale by local_id or id
    const sale = allSales.find(s => 
      s.local_id === saleId || 
      s.id === saleId || 
      s.local_id === saleId.toString() || 
      s.id === saleId.toString()
    );
    
    if (sale) {
      // Update the sale with new data
      const updated = { ...sale, ...updatedData, is_synced: 0, sync_error: null };
      await tx.store.put(updated);
      await tx.done;
      console.log(`Sale ${saleId} updated successfully`);
      return true;
    } else {
      console.warn(`Sale with ID ${saleId} not found for updating`);
      return false;
    }
  } catch (error) {
    console.error('Error updating sale:', error);
    return false;
  }
};

// Business settings
export const saveBusinessSettingsToDB = async (settings: any) => {
  const db = await getDB();
  await db.put('business_settings', settings, 'current_settings');
  return true;
};

export const getBusinessSettingsFromDB = async (): Promise<any | null> => {
  try {
    const db = await getDB();
    return await db.get('business_settings', 'current_settings');
  } catch (error) {
    console.error('Error getting business settings from DB:', error);
    return null;
  }
};

// LocalStorage helpers
export const getLocalItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error);
    return null;
  }
};

export const setLocalItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
  }
};

export const getLocalItemAsJson = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) as T : null;
  } catch (error) {
    console.error(`Error getting/parsing item ${key} from localStorage:`, error);
    return null;
  }
};

// Add location storage functions
export const saveSelectedLocationIdToDB = async (locationId: number): Promise<void> => {
  try {
    const db = await getDB();
    await db.put('settings', { key: 'selected_location_id', value: locationId });
  } catch (error) {
    console.error('Error saving selected location to IndexedDB:', error);
    throw error;
  }
};

export const getSelectedLocationIdFromDB = async (): Promise<number | null> => {
  try {
    const db = await getDB();
    const result = await db.get('settings', 'selected_location_id');
    return result ? result.value : null;
  } catch (error) {
    console.error('Error getting selected location from IndexedDB:', error);
    return null;
  }
};
