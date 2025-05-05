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

// Cache the settings
let businessSettings: BusinessSettings | null = null;

export const getBusinessSettings = async (forceRefresh = false): Promise<BusinessSettings> => {
  // Fast path: return from memory if available
  if (businessSettings && !forceRefresh) {
    return businessSettings;
  }
  
  try {
    // Check localStorage first to avoid network request
    if (!forceRefresh) {
      const cachedSettings = localStorage.getItem('business_settings');
      if (cachedSettings) {
        businessSettings = JSON.parse(cachedSettings);
        return businessSettings;
      }
    }
    
    // Only fetch from API when needed and we're online
    if (navigator.onLine) {
      const response = await api.get('/connector/api/business-details');
      const data = response.data.data;
      
      // Extract settings including locations
      businessSettings = {
        name: data.name,
        currency: data.currency,
        currency_symbol_placement: data.currency_symbol_placement,
        currency_precision: data.currency_precision,
        quantity_precision: data.quantity_precision,
        pos_settings: data.pos_settings,
        locations: data.locations // Add location data
      };
      
      // Cache for offline use
      localStorage.setItem('business_settings', JSON.stringify(businessSettings));
      
      // If we have locations, update the selected location ID if not set
      if (businessSettings.locations && businessSettings.locations.length > 0) {
        const currentLocationId = localStorage.getItem('selected_location_id');
        if (!currentLocationId) {
          // Find first active location or use the first one
          const activeLocation = businessSettings.locations.find(loc => loc.is_active === 1) || businessSettings.locations[0];
          localStorage.setItem('selected_location_id', activeLocation.id.toString());
        }
      }
      
      return businessSettings;
    } else {
      // We're offline, try localStorage again
      const cachedSettings = localStorage.getItem('business_settings');
      if (cachedSettings) {
        return JSON.parse(cachedSettings);
      }
      
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error('Error fetching business settings:', error);
    
    // Try localStorage as fallback again in case network request failed
    const cachedSettings = localStorage.getItem('business_settings');
    if (cachedSettings) {
      return JSON.parse(cachedSettings);
    }
    
    return DEFAULT_SETTINGS;
  }
};

// Helper function to get the current selected location ID
export const getSelectedLocationId = (): number | null => {
  const locationId = localStorage.getItem('selected_location_id');
  return locationId ? parseInt(locationId, 10) : null;
};

// Helper function to get the current selected location object
export const getSelectedLocation = async (): Promise<BusinessLocation | null> => {
  const locationId = getSelectedLocationId();
  if (!locationId) return null;
  
  const settings = await getBusinessSettings();
  if (!settings.locations) return null;
  
  return settings.locations.find(loc => loc.id === locationId) || null;
};

export const getLocalBusinessSettings = (): BusinessSettings | null => {
  try {
    const cachedSettings = localStorage.getItem('business_settings');
    if (cachedSettings) {
      return JSON.parse(cachedSettings);
    }
    return null;
  } catch (error) {
    console.error('Error getting business settings from localStorage:', error);
    return null;
  }
};
