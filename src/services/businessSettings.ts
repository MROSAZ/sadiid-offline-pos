/**
 * Enhanced business settings service with proper caching strategies
 */
import api from './api';

export interface CurrencyInfo {
  symbol: string;
  code: string;
  thousand_separator: string;
  decimal_separator: string;
}

export interface BusinessLocation {
  id: number;
  business_id: number;
  location_id: string | null;
  name: string;
  landmark: string | null;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  is_active: number;
  email: string | null;
  website: string | null;
  default_payment_accounts?: string;
  custom_field1?: string | null;
  custom_field2?: string | null;
  custom_field3?: string | null;
  custom_field4?: string | null;
  created_at?: string;
  updated_at?: string;
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
    [key: string]: any;
  };
  locations?: BusinessLocation[];
}

// Constants for storage and cache control
const SETTINGS_STORAGE_KEY = 'business_settings';
const LOCATIONS_STORAGE_KEY = 'business_locations';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

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

// Memory cache to reduce localStorage access
let businessSettingsCache: BusinessSettings | null = null;
let locationCache: BusinessLocation[] | null = null;
let lastFetchTimestamp = 0;

/**
 * Save settings to localStorage with timestamp
 */
export const saveSettingsToStorage = (settings: BusinessSettings): void => {
  try {
    const dataToSave = {
      settings,
      timestamp: Date.now()
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(dataToSave));
    businessSettingsCache = settings;
  } catch (error) {
    console.error('Error saving business settings to localStorage:', error);
  }
};

/**
 * Save locations to localStorage with timestamp
 */
export const saveLocationsToStorage = (locations: BusinessLocation[]): void => {
  try {
    const dataToSave = {
      locations,
      timestamp: Date.now()
    };
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(dataToSave));
    locationCache = locations;
  } catch (error) {
    console.error('Error saving business locations to localStorage:', error);
  }
};

/**
 * Check if the cache is stale
 */
export const isCacheStale = (timestamp: number): boolean => {
  return (Date.now() - timestamp) > CACHE_TTL_MS;
};

/**
 * Get business settings with improved caching strategy
 */
export const getBusinessSettings = async (forceRefresh = false): Promise<BusinessSettings> => {
  // Fast path: return from memory if available and not forced refresh
  if (businessSettingsCache && !forceRefresh && (Date.now() - lastFetchTimestamp < CACHE_TTL_MS)) {
    return businessSettingsCache;
  }

  try {
    // Check localStorage if not forcing refresh
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        
        // Use cached data if not stale
        if (!isCacheStale(parsed.timestamp)) {
          businessSettingsCache = parsed.settings;
          return parsed.settings;
        }
      }
    }
    
    // Only fetch from API when needed and we're online
    if (navigator.onLine) {
      const response = await api.get('/connector/api/business-details');
      const data = response.data.data;
      
      // Extract settings including locations
      const settings: BusinessSettings = {
        name: data.name,
        currency: data.currency,
        currency_symbol_placement: data.currency_symbol_placement,
        currency_precision: data.currency_precision,
        quantity_precision: data.quantity_precision,
        pos_settings: data.pos_settings,
        locations: data.locations // Add location data
      };
      
      // Update cache
      businessSettingsCache = settings;
      lastFetchTimestamp = Date.now();
      
      // Save to localStorage
      saveSettingsToStorage(settings);
      
      // Also cache locations separately
      if (data.locations && Array.isArray(data.locations)) {
        saveLocationsToStorage(data.locations);
      }
      
      return settings;
    } else {
      // We're offline, try localStorage again
      const cachedSettings = getLocalBusinessSettings();
      if (cachedSettings) {
        return cachedSettings;
      }
      
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error('Error fetching business settings:', error);
    
    // Try localStorage as fallback again in case network request failed
    const cachedSettings = getLocalBusinessSettings();
    if (cachedSettings) {
      return cachedSettings;
    }
    
    return DEFAULT_SETTINGS;
  }
};

/**
 * Get business settings from localStorage
 */
export const getLocalBusinessSettings = (): BusinessSettings | null => {
  try {
    const cachedData = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return parsed.settings;
    }
    return null;
  } catch (error) {
    console.error('Error getting business settings from localStorage:', error);
    return null;
  }
};

/**
 * Get business locations with improved caching
 */
export const getBusinessLocations = async (forceRefresh = false): Promise<BusinessLocation[]> => {
  // Return from memory cache if available
  if (locationCache && !forceRefresh && (Date.now() - lastFetchTimestamp < CACHE_TTL_MS)) {
    return locationCache;
  }
  
  try {
    // Check localStorage if not forcing refresh
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(LOCATIONS_STORAGE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        
        // Use cached data if not stale
        if (!isCacheStale(parsed.timestamp)) {
          locationCache = parsed.locations;
          return parsed.locations;
        }
      }
    }
    
    // If we have business settings with locations, extract from there
    const settings = await getBusinessSettings(forceRefresh);
    if (settings.locations && Array.isArray(settings.locations)) {
      locationCache = settings.locations;
      saveLocationsToStorage(settings.locations);
      return settings.locations;
    }
    
    // As a fallback, fetch locations directly
    if (navigator.onLine) {
      const response = await api.get('/connector/api/business-location');
      const locations = response.data.data;
      
      locationCache = locations;
      saveLocationsToStorage(locations);
      return locations;
    } else {
      // We're offline, try localStorage as last resort
      const cachedData = localStorage.getItem(LOCATIONS_STORAGE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        return parsed.locations;
      }
      return [];
    }
  } catch (error) {
    console.error('Error fetching business locations:', error);
    
    // Try localStorage as fallback
    const cachedData = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return parsed.locations;
    }
    
    return [];
  }
};

/**
 * Get active business locations
 */
export const getActiveLocations = async (): Promise<BusinessLocation[]> => {
  const locations = await getBusinessLocations();
  return locations.filter(location => location.is_active === 1);
};

/**
 * Get default business location (first active location)
 */
export const getDefaultLocation = async (): Promise<BusinessLocation | null> => {
  const activeLocations = await getActiveLocations();
  return activeLocations.length > 0 ? activeLocations[0] : null;
};
