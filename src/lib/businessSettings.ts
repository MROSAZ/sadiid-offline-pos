
import { toast } from 'sonner';
import { getBusinessSettingsFromStorage, saveBusinessSettings } from './storage';

// Define the business settings types
export interface BusinessLocation {
  id: number;
  name: string;
  landmark?: string;
  country?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  is_active: number;
  [key: string]: any;
}

export interface BusinessSettings {
  name: string;
  currency: {
    symbol: string;
    thousand_separator: string;
    decimal_separator: string;
    code: string;
  };
  locations: BusinessLocation[];
  [key: string]: any;
}

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

// Additional business settings related utilities can be added here
