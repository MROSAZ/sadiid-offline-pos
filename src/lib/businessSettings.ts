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
    // Return cached settings if available and not forcing refresh
    if (businessSettingsCache && !forceRefresh) {
      return businessSettingsCache;
    }

    // Check localStorage for cached settings
    if (!forceRefresh) {
      const localSettings = getBusinessSettingsFromStorage();
      if (localSettings) {
        businessSettingsCache = localSettings;
        return localSettings;
      }
    }

    // If we're online, fetch from API
    if (navigator.onLine) {
      // Mocked API call - in a real application, replace with actual API call
      // const response = await fetch('https://erp.sadiid.net/connector/api/business-details');
      // const data = await response.json();
      
      // For now, return mock data
      const mockSettings: BusinessSettings = {
        name: "Sadiid POS",
        currency: {
          symbol: "$",
          thousand_separator: ",",
          decimal_separator: ".",
          code: "USD"
        },
        locations: [
          {
            id: 1,
            name: "Main Store",
            landmark: "123 Main Street",
            country: "USA",
            state: "NY",
            city: "New York",
            zip_code: "10001",
            is_active: 1
          },
          {
            id: 2,
            name: "Branch Store",
            landmark: "456 Second Ave",
            country: "USA",
            state: "CA",
            city: "Los Angeles",
            zip_code: "90001",
            is_active: 1
          }
        ]
      };
      
      // Cache the settings
      businessSettingsCache = mockSettings;
      
      // Save to storage for offline use
      await saveBusinessSettings(mockSettings);
      
      return mockSettings;
    } else {
      // Offline: Try to get from localStorage
      const localSettings = getBusinessSettingsFromStorage();
      if (localSettings) {
        businessSettingsCache = localSettings;
        return localSettings;
      }
      
      // If no cached settings, return empty settings object
      toast.error('No business settings available offline');
      throw new Error('No business settings available offline');
    }
  } catch (error) {
    console.error('Error fetching business settings:', error);
    throw error;
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
