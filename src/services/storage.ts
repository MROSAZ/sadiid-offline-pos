
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
    indexes: { 'by-name': string };
  };
  contacts: {
    key: string;
    value: any;
    indexes: { 'by-name': string };
  };
  sales: {
    key: string;
    value: any;
    indexes: { 'by-date': string; 'by-sync': number };
  };
  user: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'sadiid-pos';
const DB_VERSION = 1;

let db: IDBPDatabase<SadiidPOSDB>;

export const initDB = async () => {
  try {
    db = await openDB<SadiidPOSDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Token store
        if (!db.objectStoreNames.contains('token')) {
          db.createObjectStore('token');
        }
        
        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by-name', 'name');
        }
        
        // Contacts store
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { keyPath: 'id' });
          contactStore.createIndex('by-name', 'name');
        }
        
        // Sales store (for offline transactions)
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { 
            keyPath: 'local_id',
            autoIncrement: true 
          });
          salesStore.createIndex('by-date', 'transaction_date');
          salesStore.createIndex('by-sync', 'is_synced');
        }
        
        // User store
        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user');
        }
      },
    });
    
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
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
  sale.is_synced = navigator.onLine ? 1 : 0;
  sale.created_at = new Date().toISOString();
  const id = await db.add('sales', sale);
  return id;
};

export const getUnSyncedSales = async () => {
  const db = await getDB();
  return db.getAllFromIndex('sales', 'by-sync', 0);
};

export const markSaleAsSynced = async (id: number) => {
  const db = await getDB();
  const sale = await db.get('sales', id);
  if (sale) {
    sale.is_synced = 1;
    await db.put('sales', sale);
  }
};

// User management
export const saveUser = async (user: any) => {
  const db = await getDB();
  await db.put('user', user, 'current_user');
  return true;
};

export const getUser = async () => {
  const db = await getDB();
  return db.get('user', 'current_user');
};
