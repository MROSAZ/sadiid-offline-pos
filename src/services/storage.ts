import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ============ TYPES & CONSTANTS ============
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
    key: number;
    value: any;
    indexes: { 'by-date': string; 'by-sync': number };
  };
  user: {
    key: string;
    value: any;
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'sadiid-pos';
const DB_VERSION = 2; // Increased version for new settings store

let db: IDBPDatabase<SadiidPOSDB>;

// ============ LOCAL STORAGE OPERATIONS ============
// Simple local storage operations for lightweight data

/**
 * Get an item from localStorage with error handling
 */
export const getLocalItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error);
    return null;
  }
};

/**
 * Get an item from localStorage and parse as JSON
 */
export const getLocalItemAsJson = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) as T : null;
  } catch (error) {
    console.error(`Error getting/parsing item ${key} from localStorage:`, error);
    return null;
  }
};

/**
 * Set an item in localStorage with error handling
 */
export const setLocalItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
  }
};

/**
 * Set an object in localStorage as JSON string
 */
export const setLocalItemAsJson = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
  }
};

/**
 * Remove an item from localStorage with error handling
 */
export const removeLocalItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item ${key} from localStorage:`, error);
  }
};

// ============ INDEXED DB OPERATIONS ============
// Database initialization

/**
 * Initialize the IndexedDB database
 */
export const initDB = async (): Promise<IDBPDatabase<SadiidPOSDB>> => {
  try {
    if (db) return db; // Avoid reinitializing if already exists
    
    db = await openDB<SadiidPOSDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        // Create stores only if they don't exist
        (["token", "user", "settings"] as const).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        });
        
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
        
        console.log(`Database upgraded from version ${oldVersion} to ${newVersion}`);
      },
    });
    
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

/**
 * Helper function to get the database instance
 */
export const getDB = async (): Promise<IDBPDatabase<SadiidPOSDB>> => {
  if (!db) {
    await initDB();
  }
  return db;
};

/**
 * Helper function for database operations
 */
export const withDB = async <T>(
  callback: (db: IDBPDatabase<SadiidPOSDB>) => Promise<T>
): Promise<T> => {
  const database = await getDB();
  return callback(database);
};

// ============ TOKEN MANAGEMENT ============

/**
 * Save authentication token to both IndexedDB and localStorage
 */
export const saveToken = async (tokenData: any): Promise<boolean> => {
  try {
    // Save to IndexedDB
    const db = await getDB();
    await db.put('token', tokenData, 'auth_token');
    
    // Also save to localStorage for quick access
    setLocalItemAsJson('auth_token', tokenData);
    
    return true;
  } catch (error) {
    console.error('Error saving token:', error);
    return false;
  }
};

/**
 * Get authentication token (tries localStorage first, then IndexedDB)
 */
export const getToken = async () => {
  try {
    // Try localStorage first (faster)
    const tokenFromStorage = getLocalItemAsJson('auth_token');
    if (tokenFromStorage) {
      return tokenFromStorage;
    }
    
    // If not in localStorage, try IndexedDB
    const db = await getDB();
    return db.get('token', 'auth_token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Remove authentication token from both storages
 */
export const removeToken = async (): Promise<boolean> => {
  try {
    // Remove from localStorage
    removeLocalItem('auth_token');
    
    // Remove from IndexedDB
    const db = await getDB();
    await db.delete('token', 'auth_token');
    
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};

// ============ PRODUCT MANAGEMENT ============

/**
 * Save products to IndexedDB
 */
export const saveProducts = async (products: any[]): Promise<boolean> => {
  return withDB(async (db) => {
    const tx = db.transaction('products', 'readwrite');
    for (const product of products) {
      await tx.store.put(product);
    }
    await tx.done;
    return true;
  });
};

/**
 * Get all products from IndexedDB
 */
export const getProducts = async () => {
  return withDB(async (db) => {
    return db.getAll('products');
  });
};

/**
 * Get product categories from products
 */
export const getCategories = async (): Promise<any[]> => {
  try {
    return withDB(async (db) => {
      const products = await db.getAll('products');
      
      // Extract unique categories from products
      const categoriesMap = new Map();
      
      products.forEach(product => {
        if (product.category) {
          categoriesMap.set(product.category.id, product.category);
        }
      });
      
      // Convert map values to array and sort by name
      return Array.from(categoriesMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (categoryId: number): Promise<any[]> => {
  return withDB(async (db) => {
    if (!categoryId) {
      return db.getAll('products');
    }
    return db.getAllFromIndex('products', 'by-category', categoryId);
  });
};

// ============ CONTACT MANAGEMENT ============

/**
 * Save contacts to IndexedDB
 */
export const saveContacts = async (contacts: any[]): Promise<boolean> => {
  return withDB(async (db) => {
    const tx = db.transaction('contacts', 'readwrite');
    for (const contact of contacts) {
      await tx.store.put(contact);
    }
    await tx.done;
    return true;
  });
};

/**
 * Get all contacts from IndexedDB
 */
export const getContacts = async () => {
  return withDB(async (db) => {
    return db.getAll('contacts');
  });
};

// ============ SALES MANAGEMENT ============

/**
 * Save a sale to IndexedDB
 */
export const saveSale = async (sale: any) => {
  return withDB(async (db) => {
    // Mark as not synced if offline
    sale.is_synced = navigator.onLine ? 1 : 0;
    if (!sale.transaction_date) {
      sale.transaction_date = new Date().toISOString();
    }
    return db.add('sales', sale);
  });
};

/**
 * Get sales that haven't been synced yet
 */
export const getUnSyncedSales = async () => {
  return withDB(async (db) => {
    return db.getAllFromIndex('sales', 'by-sync', 0);
  });
};

/**
 * Mark a sale as synced
 */
export const markSaleAsSynced = async (id: number): Promise<boolean> => {
  try {
    return withDB(async (db) => {
      const sale = await db.get('sales', id);
      if (sale) {
        sale.is_synced = 1;
        await db.put('sales', sale);
      }
      return true;
    });
  } catch (error) {
    console.error('Error marking sale as synced:', error);
    return false;
  }
};

/**
 * Get paginated sales
 */
export const getSales = async (page = 1, limit = 20) => {
  return withDB(async (db) => {
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
  });
};

// ============ USER MANAGEMENT ============

/**
 * Save user information to IndexedDB
 */
export const saveUser = async (user: any) => {
  return withDB(async (db) => {
    await db.put('user', user, 'current_user');
    // Also save minimal user info to localStorage for quick access
    const { id, name, email } = user;
    setLocalItemAsJson('user_info', { id, name, email });
    return true;
  });
};

/**
 * Get user information from IndexedDB
 */
export const getUser = async () => {
  try {
    return withDB(async (db) => {
      return db.get('user', 'current_user');
    });
  } catch (error) {
    console.error('Error getting user from IndexedDB:', error);
    return null;
  }
};

// ============ SETTINGS MANAGEMENT ============

/**
 * Save business settings
 */
export const saveBusinessSettings = async (settings: any): Promise<boolean> => {
  try {
    await withDB(async (db) => {
      await db.put('settings', settings, 'business_settings');
    });
    
    // Also store in localStorage for quick access
    setLocalItemAsJson('business_settings', settings);
    
    return true;
  } catch (error) {
    console.error('Error saving business settings:', error);
    return false;
  }
};

/**
 * Get business settings
 */
export const getBusinessSettings = async () => {
  try {
    // Try localStorage first (faster)
    const settingsFromStorage = getLocalItemAsJson('business_settings');
    if (settingsFromStorage) {
      return settingsFromStorage;
    }
    
    // If not in localStorage, try IndexedDB
    return withDB(async (db) => {
      return db.get('settings', 'business_settings');
    });
  } catch (error) {
    console.error('Error getting business settings:', error);
    return null;
  }
};

/**
 * Save selected location ID
 */
export const saveSelectedLocation = (locationId: number): void => {
  setLocalItem('selected_location_id', locationId.toString());
};

/**
 * Get selected location ID
 */
export const getSelectedLocationId = (): number | null => {
  const locationId = getLocalItem('selected_location_id');
  return locationId ? parseInt(locationId, 10) : null;
};

// Additional utility functions can be added here as needed
