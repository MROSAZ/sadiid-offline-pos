import api from './api';

export interface CurrencyInfo {
  symbol: string;
  code: string;
  thousand_separator: string;
  decimal_separator: string;
}

export interface BusinessSettings {
  name: string;
  currency: CurrencyInfo;
  currency_symbol_placement: 'before' | 'after';
  currency_precision: number;
  quantity_precision: number;
  pos_settings: {
    amount_rounding_method: string;
  }
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
  // Return cached settings if available and not forcing refresh
  if (businessSettings && !forceRefresh) {
    return businessSettings;
  }
  
  try {
    // Try loading from localStorage first (for offline use)
    const cachedSettings = localStorage.getItem('business_settings');
    if (!forceRefresh && cachedSettings) {
      return JSON.parse(cachedSettings);
    }
    
    // Fetch from API if online
    const response = await api.get('/connector/api/business-details');
    const data = response.data.data;
    
    // Extract needed settings
    businessSettings = {
      name: data.name,
      currency: data.currency,
      currency_symbol_placement: data.currency_symbol_placement,
      currency_precision: data.currency_precision,
      quantity_precision: data.quantity_precision,
      pos_settings: data.pos_settings
    };
    
    // Cache for offline use
    localStorage.setItem('business_settings', JSON.stringify(businessSettings));
    return businessSettings;
  } catch (error) {
    console.error('Error fetching business settings:', error);
    
    // Try localStorage as fallback
    const cachedSettings = localStorage.getItem('business_settings');
    if (cachedSettings) {
      return JSON.parse(cachedSettings);
    }
    
    // Use default settings if all else fails
    return DEFAULT_SETTINGS;
  }
};