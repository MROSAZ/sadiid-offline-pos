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
      timestamp: string;
    };
    indexes: { 'by-timestamp': string }; // Fixed: Added proper index definition
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
          const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
          settingsStore.createIndex('by-timestamp', 'timestamp', { unique: false }); // Fixed: Correct index name
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
  localStorage.setItem('auth_token', JSON.stringify(tokenData));
  const db = await getDB();
  await db.put('token', tokenData, 'auth_token');
  return true;
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
  const db = await getDB();
  await db.put('user', user, 'current_user');
  return true;
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
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  for (const product of products) {
    await tx.store.put(product);
  }
  await tx.done;
  return true;
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
  const db = await getDB();
  const tx = db.transaction('contacts', 'readwrite');
  for (const contact of contacts) {
    await tx.store.put(contact);
  }
  await tx.done;
  return true;
};

export const getContacts = async () => {
  const db = await getDB();
  return db.getAll('contacts');
};

// Sales management
export const saveSale = async (sale: any) => {
  const db = await getDB();
  // Mark as not synced if offline
  sale.is_synced = navigator.onLine ? 1 : 0;
  sale.transaction_date = new Date().toISOString();
  const id = await db.add('sales', sale);
  return id;
};

export const getUnSyncedSales = async () => {
  const db = await getDB();
  return db.getAllFromIndex('sales', 'by-sync', 0);
};

export const markSaleAsSynced = async (id: number): Promise<boolean> => {
  try {
    const db = await getDB();
    const sale = await db.get('sales', id);
    if (sale) {
      sale.is_synced = 1;
      await db.put('sales', sale);
    }
    return true;
  } catch (error) {
    console.error('Error marking sale as synced:', error);
    return false;
  }
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

// Business settings
export const saveBusinessSettings = async (settings: any) => {
  const db = await getDB();
  // Also save to localStorage for quick access
  localStorage.setItem('business_settings', JSON.stringify(settings));
  await db.put('business_settings', settings, 'current_settings');
  return true;
};

export const getBusinessSettingsFromStorage = () => {
  try {
    const settingsString = localStorage.getItem('business_settings');
    return settingsString ? JSON.parse(settingsString) : null;
  } catch (error) {
    console.error('Error loading business settings from localStorage:', error);
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
export const saveSelectedLocation = async (locationId: number): Promise<void> => {
  try {
    const db = await getDB(); // Fixed: Use getDB() instead of openDB()
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    
    await store.put({
      key: 'selected_location_id',
      value: locationId,
      timestamp: new Date().toISOString()
    });
    
    await transaction.done; // Fixed: Use transaction.done instead of transaction.complete
  } catch (error) {
    console.error('Error saving selected location to IndexedDB:', error);
    throw error;
  }
};

export const getSelectedLocationFromDB = async (): Promise<number | null> => { // Fixed: Renamed to avoid conflict
  try {
    const db = await getDB(); // Fixed: Use getDB() instead of openDB()
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    
    const result = await store.get('selected_location_id');
    return result ? result.value : null;
  } catch (error) {
    console.error('Error getting selected location from IndexedDB:', error);
    return null;
  }
};
