import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { VersionedData, SyncStatus, SyncQueueItem, SyncPriority, SyncOperationType } from './types/sync';
import crypto from 'crypto-js';

/**
 * Schema version constants
 */
const SCHEMA_VERSIONS = {
  PRODUCTS: 1,
  CONTACTS: 1,
  SALES: 1,
  SETTINGS: 1
};

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
    value: VersionedData<any>;
    indexes: { 
      'by-name': string; 
      'by-category': number;
      'by-version': number;
      'by-sync-status': SyncStatus;
      'by-last-modified': number;
    };
  };
  contacts: {
    key: string;
    value: VersionedData<any>;
    indexes: { 
      'by-name': string;
      'by-version': number;
      'by-sync-status': SyncStatus;
      'by-last-modified': number;
    };
  };
  sales: {
    key: number; // Using autoIncrement
    value: VersionedData<any>;
    indexes: { 
      'by-date': string; 
      'by-sync-status': SyncStatus;
      'by-version': number;
      'by-last-modified': number;
    };
  };
  user: {
    key: string;
    value: VersionedData<any>;
    indexes: {
      'by-version': number;
      'by-sync-status': SyncStatus;
    };
  };
  settings: {
    key: string;
    value: VersionedData<any>;
    indexes: {
      'by-version': number;
      'by-sync-status': SyncStatus;
      'by-last-modified': number;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-status': SyncStatus;
      'by-priority': SyncPriority;
      'by-type': SyncOperationType;
      'by-entity': string;
      'by-created-at': number;
    };
  };
}

const DB_NAME = 'sadiid-pos';
const DB_VERSION = 2;

let db: IDBPDatabase<SadiidPOSDB>;

// Simplify database initialization with better error handling
export const initDB = async () => {
  try {
    if (db) return db; // Avoid reinitializing if already exists
    
    db = await openDB<SadiidPOSDB>(DB_NAME, DB_VERSION, {
      upgrade(database, oldVersion, newVersion) {
        // Handle database upgrades based on version
        if (oldVersion < 1) {
          createInitialSchema(database);
        }
        
        if (oldVersion < 2) {
          upgradeToV2(database);
        }
      },
    });
    
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

/**
 * Create initial database schema (version 1)
 */
function createInitialSchema(db: IDBPDatabase<SadiidPOSDB>) {
  console.log('Creating initial database schema (v1)');
  
  // Create simple stores
  (["token", "user"] as const).forEach((storeName) => {
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName);
    }
  });
  
  // Create products store
  if (!db.objectStoreNames.contains('products')) {
    const productStore = db.createObjectStore('products', { keyPath: 'id' });
    productStore.createIndex('by-name', 'name');
    productStore.createIndex('by-category', 'category.id');
  }
  
  // Create contacts store
  if (!db.objectStoreNames.contains('contacts')) {
    const contactStore = db.createObjectStore('contacts', { keyPath: 'id' });
    contactStore.createIndex('by-name', 'name');
  }
  
  // Create sales store
  if (!db.objectStoreNames.contains('sales')) {
    const salesStore = db.createObjectStore('sales', { 
      keyPath: 'local_id',
      autoIncrement: true 
    });
    salesStore.createIndex('by-date', 'transaction_date');
    salesStore.createIndex('by-sync', 'is_synced');
  }
}

/**
 * Upgrade database to version 2
 * - Adds versioning to existing data
 * - Adds sync queue store
 * - Adds settings store
 * - Updates indexes to support versioning and sync status
 */
function upgradeToV2(db: IDBPDatabase<SadiidPOSDB>) {
  console.log('Upgrading database to v2 with versioning and sync queue');
  
  // Add settings store if it doesn't exist
  if (!db.objectStoreNames.contains('settings')) {
    const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
    settingsStore.createIndex('by-version', 'data.version');
    settingsStore.createIndex('by-sync-status', 'syncStatus');
    settingsStore.createIndex('by-last-modified', 'lastModified');
  }
  
  // Add sync queue store
  if (!db.objectStoreNames.contains('syncQueue')) {
    const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
    syncQueueStore.createIndex('by-status', 'status');
    syncQueueStore.createIndex('by-priority', 'priority');
    syncQueueStore.createIndex('by-type', 'type');
    syncQueueStore.createIndex('by-entity', 'entityType');
    syncQueueStore.createIndex('by-created-at', 'createdAt');
  }
  
  // Migrate existing stores to use versioned data
  migrateToVersionedData(db);
}

/**
 * Migrate existing data to use versioning
 */
async function migrateToVersionedData(db: IDBPDatabase<SadiidPOSDB>) {
  console.log('Migrating existing data to versioned format');
  
  // Helper function to wrap data with versioning
  function wrapWithVersion<T>(data: T, id: string | number): VersionedData<T> {
    const timestamp = Date.now();
    return {
      id,
      data,
      version: 1,
      lastModified: timestamp,
      createdAt: timestamp,
      syncStatus: SyncStatus.COMPLETED, // Assume existing data is already synced
      syncedAt: timestamp,
      checksum: generateChecksum(data)
    };
  }
  
  try {
    // Migrate products
    const productsTx = db.transaction('products', 'readwrite');
    const productsStore = productsTx.objectStore('products');
    
    // Add new indexes if they don't exist
    if (!productsStore.indexNames.contains('by-version')) {
      productsStore.createIndex('by-version', 'version');
    }
    if (!productsStore.indexNames.contains('by-sync-status')) {
      productsStore.createIndex('by-sync-status', 'syncStatus');
    }
    if (!productsStore.indexNames.contains('by-last-modified')) {
      productsStore.createIndex('by-last-modified', 'lastModified');
    }
    
    // Update product index paths
    if (productsStore.indexNames.contains('by-name')) {
      // Delete and recreate index with updated path
      productsStore.deleteIndex('by-name');
      productsStore.createIndex('by-name', 'data.name');
    }
    if (productsStore.indexNames.contains('by-category')) {
      productsStore.deleteIndex('by-category');
      productsStore.createIndex('by-category', 'data.category.id');
    }
    
    // Migrate contacts
    const contactsTx = db.transaction('contacts', 'readwrite');
    const contactsStore = contactsTx.objectStore('contacts');
    
    // Add new indexes
    if (!contactsStore.indexNames.contains('by-version')) {
      contactsStore.createIndex('by-version', 'version');
    }
    if (!contactsStore.indexNames.contains('by-sync-status')) {
      contactsStore.createIndex('by-sync-status', 'syncStatus');
    }
    if (!contactsStore.indexNames.contains('by-last-modified')) {
      contactsStore.createIndex('by-last-modified', 'lastModified');
    }
    
    // Update contact index paths
    if (contactsStore.indexNames.contains('by-name')) {
      contactsStore.deleteIndex('by-name');
      contactsStore.createIndex('by-name', 'data.name');
    }
    
    // Migrate sales
    const salesTx = db.transaction('sales', 'readwrite');
    const salesStore = salesTx.objectStore('sales');
    
    // Add new indexes
    if (!salesStore.indexNames.contains('by-version')) {
      salesStore.createIndex('by-version', 'version');
    }
    if (!salesStore.indexNames.contains('by-sync-status')) {
      salesStore.createIndex('by-sync-status', 'syncStatus');
    }
    if (!salesStore.indexNames.contains('by-last-modified')) {
      salesStore.createIndex('by-last-modified', 'lastModified');
    }
    
    // Update sales index paths
    if (salesStore.indexNames.contains('by-date')) {
      salesStore.deleteIndex('by-date');
      salesStore.createIndex('by-date', 'data.transaction_date');
    }
    if (salesStore.indexNames.contains('by-sync')) {
      salesStore.deleteIndex('by-sync');
    }
    
    // The actual data migration will happen on first access after upgrade
    // to avoid blocking the upgrade process for too long
  } catch (error) {
    console.error('Error during database schema migration:', error);
    // Allow the upgrade to continue even if migration fails
    // Data will be fixed on next access
  }
}

// Simplify DB access with a wrapper function
export const withDB = async <T>(
  callback: (db: IDBPDatabase<SadiidPOSDB>) => Promise<T>
): Promise<T> => {
  const database = await getDB();
  return callback(database);
};

// Get the database instance
export const getDB = async () => {
  if (!db) {
    await initDB();
  }
  return db;
};

// Token management
export const saveToken = async (tokenData: any) => {
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

/**
 * Helper function to wrap data with versioning information
 */
export function wrapWithVersion<T>(data: T, id: string | number, version = 1): VersionedData<T> {
  const timestamp = Date.now();
  return {
    id,
    data,
    version,
    lastModified: timestamp,
    createdAt: timestamp,
    syncStatus: SyncStatus.PENDING,
    checksum: generateChecksum(data)
  };
}

/**
 * Generate a checksum for data integrity
 */
function generateChecksum(data: any): string {
  return crypto.SHA256(JSON.stringify(data)).toString();
}

/**
 * Verify data integrity using checksum
 */
export function verifyDataIntegrity<T>(versionedData: VersionedData<T>): boolean {
  const currentChecksum = generateChecksum(versionedData.data);
  return currentChecksum === versionedData.checksum;
}

// Product management
export const saveProducts = async (products: any[]) => {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  
  for (const product of products) {

// Get product categories
export const getCategories = async (): Promise<any[]> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(['products'], 'readonly');
    const productStore = transaction.objectStore('products');
    const products = await productStore.getAll();
    
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
  return withDB(async (db) => {
    if (!categoryId) {
      return db.getAll('products');
    }
    return db.getAllFromIndex('products', 'by-category', categoryId);
  });
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

// Get an item from localStorage with error handling
export const getLocalItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error);
    return null;
  }
};

// Set an item in localStorage with error handling
export const setLocalItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
  }
};

// Get item from localStorage and parse as JSON
export const getLocalItemAsJson = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) as T : null;
  } catch (error) {
    console.error(`Error getting/parsing item ${key} from localStorage:`, error);
    return null;
  }
};
