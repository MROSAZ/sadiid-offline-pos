import { saveBusinessSettingsToDB, getBusinessSettingsFromDB } from '@/lib/storage';
import { fetchBusinessDetails } from '@/services/api';
import { performWhenOnline, queueBackgroundTask, BackgroundTasks } from '@/utils/backgroundSync';

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
  timezone?: string;
  pos_settings?: {
    amount_rounding_method: string;
    [key: string]: any;
  };
  locations?: BusinessLocation[];
  [key: string]: any;
}

// Cache for business settings
let businessSettingsCache: BusinessSettings | null = null;

/**
 * Get business settings from API or cache
 */
export const getBusinessSettings = async (forceRefresh = false): Promise<BusinessSettings> => {
  console.log(`getBusinessSettings called with forceRefresh: ${forceRefresh}`);

  // 1. Return in-memory cache if available and not forcing refresh
  if (businessSettingsCache && !forceRefresh) {
    console.log('Returning cached business settings');
    // If online, queue a background refresh but don't wait for it
    if (navigator.onLine) {
      queueBackgroundSettingsRefresh();
    }
    return businessSettingsCache;
  }

  // 2. Try to get from IndexedDB if not in memory cache
  if (!forceRefresh) {
    const dbSettings = await getBusinessSettingsFromDB();
    if (dbSettings) {
      console.log('Returning settings from IndexedDB');
      businessSettingsCache = dbSettings;
      // If online, queue a background refresh
      if (navigator.onLine) {
        queueBackgroundSettingsRefresh();
      }
      return dbSettings;
    }
  }

  // 3. Fetch from API if online and required
  if (navigator.onLine) {
    try {
      console.log('Fetching business details from API...');
      const apiData = await fetchBusinessDetails();

      if (!apiData || !apiData.name || !apiData.currency) {
        throw new Error('Invalid API response for business details');
      }

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
        timezone: apiData.time_zone || 'UTC',
        pos_settings: apiData.pos_settings || { amount_rounding_method: null },
        locations: Array.isArray(apiData.locations) ? apiData.locations : []
      };

      // Update cache and save to DB
      businessSettingsCache = settings;
      await saveBusinessSettingsToDB(settings);
      console.log('Fetched and updated business settings');
      return settings;
    } catch (apiError) {
      console.error('Error fetching business settings from API:', apiError);
      // Don't rethrow, proceed to fallback
    }
  }

  // 4. Final fallback: check DB again or use defaults
  const finalDBSettings = await getBusinessSettingsFromDB();
  if (finalDBSettings) {
    console.log('Using DB settings as final fallback');
    businessSettingsCache = finalDBSettings;
    return finalDBSettings;
  }

  console.warn('All sources failed, using default settings');
  const defaultSettings = createMockBusinessSettings();
  businessSettingsCache = defaultSettings;
  return defaultSettings;
};

/**
 * Queue a background refresh of business settings without blocking the UI
 */
const queueBackgroundSettingsRefresh = async (): Promise<void> => {
  const refreshTask = performWhenOnline(async () => {
    console.log('Performing background settings refresh...');
    const apiData = await fetchBusinessDetails();

    if (apiData && apiData.name && apiData.currency) {
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
        timezone: apiData.time_zone || 'UTC',
        pos_settings: apiData.pos_settings || { amount_rounding_method: null },
        locations: Array.isArray(apiData.locations) ? apiData.locations : []
      };

      // Update cache and storage
      businessSettingsCache = settings;
      await saveBusinessSettingsToDB(settings);

      console.log('Background settings refresh completed');
    }
  });

  queueBackgroundTask(BackgroundTasks.BUSINESS_SETTINGS_REFRESH, refreshTask, 100);
};

/**
 * Get local business settings without async
 */
export const getLocalBusinessSettings = (): BusinessSettings | null => {
  return businessSettingsCache;
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
  timezone: "UTC",
  pos_settings: {
    amount_rounding_method: null
  },
  locations: []
});

export const getDefaultBusinessSettings = (): BusinessSettings => {
  return createMockBusinessSettings();
};
