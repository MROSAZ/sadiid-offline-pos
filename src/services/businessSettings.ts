import { getBusinessDetails } from './api';

/**
 * Interface definitions for business settings data structures
 */
export interface CurrencyInfo {
  symbol: string;
  code: string;
  thousand_separator: string;
  decimal_separator: string;
}

export interface BusinessLocation {
  id: number;
  business_id: number;
  location_id: string;
  name: string;
  landmark: string | null;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  is_active: number;
  email: string | null;
  website: string | null;
  // Other properties as needed
}

export interface BusinessSettings {
  name: string;
  currency: CurrencyInfo;
  currency_symbol_placement: 'before' | 'after';
  currency_precision: number;
  quantity_precision: number;
  pos_settings: {
    amount_rounding_method: string;
  };
  locations?: BusinessLocation[];
}

// Default settings if API fails
const DEFAULT_SETTINGS: BusinessSettings = {
  name: 'Sadiid',
  currency: {
    symbol: 'DT',
    code: 'TND',
    thousand_separator: '.',
    decimal_separator: ',',
  },
  currency_symbol_placement: 'after',
  currency_precision: 3,
  quantity_precision: 3,
  pos_settings: {
    amount_rounding_method: '0.1',
  }
};

// Cache management
const BUSINESS_SETTINGS_KEY = 'business_settings';
const SETTINGS_TIMESTAMP_KEY = 'business_settings_timestamp';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache
let businessSettings: BusinessSettings | null = null;
let fetchInProgress: Promise<BusinessSettings> | null = null;

/**
 * Initialize business settings - called once during app startup
 * Prioritizes: 1) In-memory cache 2) LocalStorage 3) API
 */
export const initBusinessSettings = async (): Promise<BusinessSettings> => {
  // Check in-memory cache first (fastest)
  if (businessSettings) {
    return businessSettings;
  }
  
  try {
    // Then check localStorage (no network required)
    const cachedSettings = localStorage.getItem(BUSINESS_SETTINGS_KEY);
    const timestamp = localStorage.getItem(SETTINGS_TIMESTAMP_KEY);
    
    if (cachedSettings) {
      businessSettings = JSON.parse(cachedSettings);
      
      // If online and cache is old, refresh in background but return cached data immediately
      if (navigator.onLine && timestamp && (Date.now() - Number(timestamp)) > CACHE_MAX_AGE) {
        // Don't await - refresh in background but don't block UI
        refreshBusinessSettings().catch(err => 
          console.error('Background refresh of business settings failed:', err)
        );
      }
      
      return businessSettings;
    }

    // If no cached data and online, fetch from API
    if (navigator.onLine) {
      return await refreshBusinessSettings();
    }
    
    // Offline without cache - use defaults
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error initializing business settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Fetch fresh data from API and update cache
 */
const refreshBusinessSettings = async (): Promise<BusinessSettings> => {
  // Only one fetch at a time
  if (fetchInProgress) {
    return fetchInProgress;
  }

  try {
    fetchInProgress = (async () => {
      console.log('Fetching business details from API...');
      const data = await getBusinessDetails();
      
      // Process and store settings
      businessSettings = {
        name: data.name,
        currency: data.currency,
        currency_symbol_placement: data.currency_symbol_placement,
        currency_precision: data.currency_precision,
        quantity_precision: data.quantity_precision,
        pos_settings: data.pos_settings,
        locations: data.locations
      };
      
      // Update cache with timestamp
      localStorage.setItem(BUSINESS_SETTINGS_KEY, JSON.stringify(businessSettings));
      localStorage.setItem(SETTINGS_TIMESTAMP_KEY, Date.now().toString());
      
      return businessSettings;
    })();
    
    const result = await fetchInProgress;
    fetchInProgress = null;
    return result;
  } catch (error) {
    console.error('Error fetching business details:', error);
    fetchInProgress = null;
    throw error;
  }
};

/**
 * Get business settings - first from memory cache, then localStorage,
 * only fetch from API when forcing refresh
 */
export const getBusinessSettings = async (forceRefresh = false): Promise<BusinessSettings> => {
  // Fast path: return from memory if available and not forcing refresh
  if (businessSettings && !forceRefresh) {
    return businessSettings;
  }
  
  try {
    // If not forcing refresh, check localStorage before fetching
    if (!forceRefresh) {
      const cachedSettings = localStorage.getItem(BUSINESS_SETTINGS_KEY);
      if (cachedSettings) {
        businessSettings = JSON.parse(cachedSettings);
        return businessSettings;
      }
    }
    
    // Only fetch from API when forcing refresh and we're online
    if (navigator.onLine && forceRefresh) {
      return await refreshBusinessSettings();
    }
    
    // Return the current settings or defaults
    return businessSettings || DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error in getBusinessSettings:', error);
    
    // Try localStorage as fallback
    const cachedSettings = localStorage.getItem(BUSINESS_SETTINGS_KEY);
    if (cachedSettings) {
      businessSettings = JSON.parse(cachedSettings);
      return businessSettings;
    }
    
    return DEFAULT_SETTINGS;
  }
};

export const getLocalBusinessSettings = (): BusinessSettings | null => {
  try {
    // First try from memory cache
    if (businessSettings) {
      return businessSettings;
    }
    
    // Then try from localStorage
    const cachedSettings = localStorage.getItem(BUSINESS_SETTINGS_KEY);
    if (cachedSettings) {
      return JSON.parse(cachedSettings);
    }
    return null;
  } catch (error) {
    console.error('Error getting business settings from localStorage:', error);
    return null;
  }
};
