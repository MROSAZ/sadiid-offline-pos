import { toast } from 'sonner';
import { getBusinessSettingsFromStorage, saveBusinessSettings } from './storage';
import api from '../services/api';

// Define the business settings types
export interface CurrencyInfo {
  symbol: string;
  code: string;
  thousand_separator: string;
  decimal_separator: string;
}

export interface BusinessLocation {
  id: number;
  business_id?: number;
  location_id?: string | null;
  name: string;
  landmark?: string | null;
  country?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  is_active: number;
  email?: string | null;
  website?: string | null;
  default_payment_accounts?: string;
  custom_field1?: string | null;
  custom_field2?: string | null;
  custom_field3?: string | null;
  custom_field4?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface BusinessSettings {
  name: string;
  currency: CurrencyInfo;
  currency_symbol_placement?: 'before' | 'after';
  currency_precision?: number;
  quantity_precision?: number;
  pos_settings?: {
    amount_rounding_method: string;
    [key: string]: any;
  };
  locations?: BusinessLocation[];
  [key: string]: any;
}

// Constants for storage and cache control
const SETTINGS_STORAGE_KEY = 'business_settings';
const LOCATIONS_STORAGE_KEY = 'business_locations';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache for business settings
let businessSettingsCache: BusinessSettings | null = null;

/**
 * Get business settings from API or cache
 */
export const getBusinessSettings = async (forceRefresh = false): Promise<BusinessSettings> => {
  try {
    console.log('getBusinessSettings called with forceRefresh:', forceRefresh);
    
    // Return cached settings if available and not forcing refresh
    if (businessSettingsCache && !forceRefresh) {
      console.log('Returning cached business settings');
      return businessSettingsCache;
    }

    // Check localStorage for cached settings first (unless forcing refresh)
    if (!forceRefresh) {
      const localSettings = getBusinessSettingsFromStorage();
      if (localSettings) {
        console.log('Returning stored business settings');
        businessSettingsCache = localSettings;
        return localSettings;
      }
    }// If we're online, fetch from API
    if (navigator.onLine) {
      try {
        const { fetchBusinessDetails } = await import('@/services/api');
        const apiData = await fetchBusinessDetails();
        
        console.log('API Response received:', apiData);
        
        // Validate required fields exist
        if (!apiData || !apiData.name || !apiData.currency) {
          console.error('Invalid API response structure:', apiData);
          throw new Error('Invalid business details response from API');
        }
        
        // Transform API response to BusinessSettings format
        const settings: BusinessSettings = {
          name: apiData.name,
          currency: {
            symbol: apiData.currency.symbol || '$',
            code: apiData.currency.code || 'USD',
            thousand_separator: apiData.currency.thousand_separator || ',',
            decimal_separator: apiData.currency.decimal_separator || '.'
          },
          currency_symbol_placement: apiData.currency_symbol_placement || 'before',
          currency_precision: apiData.currency_precision || 2,
          quantity_precision: apiData.quantity_precision || 2,
          pos_settings: apiData.pos_settings || {
            amount_rounding_method: null
          },
          locations: Array.isArray(apiData.locations) ? apiData.locations : []
        };

        console.log('Transformed business settings:', settings);

        // Cache the settings
        businessSettingsCache = settings;
        saveSettingsToStorage(settings);
        
        return settings;
      } catch (apiError) {
        console.error('API Error details:', apiError);
        
        // Fallback to local storage on API error
        const localSettings = getBusinessSettingsFromStorage();
        if (localSettings) {
          console.log('Using cached business settings due to API error');
          businessSettingsCache = localSettings;
          return localSettings;
        }
        
        throw apiError;      }
    } else {
      // Offline: Try to get from localStorage
      console.log('Device is offline, checking for cached settings');
      const localSettings = getBusinessSettingsFromStorage();
      if (localSettings) {
        console.log('Using cached business settings (offline)');
        businessSettingsCache = localSettings;
        return localSettings;
      }
      
      // If no cached settings available offline, return default settings
      console.warn('No cached settings available offline, using defaults');
      const defaultSettings = createMockBusinessSettings();
      businessSettingsCache = defaultSettings;
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error fetching business settings:', error);
    
    // Final fallback: try to get any cached settings
    const localSettings = getBusinessSettingsFromStorage();
    if (localSettings) {
      console.log('Using cached settings as final fallback');
      businessSettingsCache = localSettings;
      return localSettings;
    }
    
    // Ultimate fallback: return default settings
    console.warn('All sources failed, using default settings');
    const defaultSettings = createMockBusinessSettings();
    businessSettingsCache = defaultSettings;
    return defaultSettings;
  }
};

/**
 * Get local business settings without async
 */
export const getLocalBusinessSettings = (): BusinessSettings | null => {
  if (businessSettingsCache) {
    return businessSettingsCache;
  }
  
  return getBusinessSettingsFromStorage();
};

// Cache for business locations
let businessLocationsCache: BusinessLocation[] | null = null;
let locationsTimestamp: number = 0;

/**
 * Save business settings to local storage with timestamp
 */
export const saveSettingsToStorage = (settings: BusinessSettings): void => {
  try {
    const storageData = {
      settings,
      timestamp: Date.now()
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error('Error saving business settings to storage:', error);
  }
};

/**
 * Save business locations to local storage with timestamp
 */
export const saveLocationsToStorage = (locations: BusinessLocation[]): void => {
  try {
    const storageData = {
      locations,
      timestamp: Date.now()
    };
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error('Error saving business locations to storage:', error);
  }
};

/**
 * Check if cached data is stale
 */
export const isCacheStale = (timestamp: number): boolean => {
  return Date.now() - timestamp > CACHE_DURATION;
};

/**
 * Get business locations from API or cache
 */
export const getBusinessLocations = async (forceRefresh = false): Promise<BusinessLocation[]> => {
  try {
    // Return cached locations if available and not stale
    if (businessLocationsCache && !forceRefresh && !isCacheStale(locationsTimestamp)) {
      return businessLocationsCache;
    }

    // Try to get from local storage first
    const storedData = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (storedData && !forceRefresh) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.locations && !isCacheStale(parsed.timestamp)) {
          businessLocationsCache = parsed.locations;
          locationsTimestamp = parsed.timestamp;
          return businessLocationsCache;
        }
      } catch (error) {
        console.warn('Error parsing stored business locations:', error);
      }
    }

    // Fetch from API
    const response = await api.get('/connector/api/business-location');
    const locations = response.data?.data || [];
    
    // Update cache and storage
    businessLocationsCache = locations;
    locationsTimestamp = Date.now();
    saveLocationsToStorage(locations);
    
    return locations;
  } catch (error) {
    console.error('Error fetching business locations:', error);
    
    // Return cached data as fallback
    if (businessLocationsCache) {
      return businessLocationsCache;
    }
    
    // Try to get from local storage as last resort
    const storedData = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        return parsed.locations || [];
      } catch (parseError) {
        console.error('Error parsing stored locations:', parseError);
      }
    }
    
    return [];
  }
};

/**
 * Get only active business locations
 */
export const getActiveLocations = async (): Promise<BusinessLocation[]> => {
  const locations = await getBusinessLocations();
  return locations.filter(location => location.is_active === 1);
};

/**
 * Get the default business location (first active location)
 */
export const getDefaultLocation = async (): Promise<BusinessLocation | null> => {
  const activeLocations = await getActiveLocations();
  return activeLocations.length > 0 ? activeLocations[0] : null;
};

// Mock business settings for testing/debugging
export const createMockBusinessSettings = (): BusinessSettings => ({
  name: "Test Business",
  currency: {
    symbol: "$",
    code: "USD",
    thousand_separator: ",",
    decimal_separator: "."
  },
  currency_symbol_placement: "before",
  currency_precision: 2,
  quantity_precision: 2,
  pos_settings: {
    amount_rounding_method: null
  },
  locations: []
});

export const getDefaultBusinessSettings = (): BusinessSettings => {
  return createMockBusinessSettings();
};
