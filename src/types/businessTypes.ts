export interface CurrencyInfo {
  symbol: string;
  code?: string;
  thousand_separator: string;
  decimal_separator: string;
}

export interface BusinessLocation {
  id: number;
  business_id?: number;
  location_id?: string;
  name: string;
  landmark?: string | null;
  country?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  is_active: number;
  email?: string | null;
  website?: string | null;
}

export interface BusinessSettings {
  name?: string;
  currency: CurrencyInfo;
  currency_symbol_placement: 'before' | 'after';
  currency_precision: number;
  quantity_precision?: number;
  pos_settings?: {
    amount_rounding_method?: string;
  };
  locations?: BusinessLocation[];
}

// Default settings if retrieval fails
export const DEFAULT_SETTINGS: BusinessSettings = {
  currency: {
    symbol: '$',
    thousand_separator: ',',
    decimal_separator: '.'
  },
  currency_symbol_placement: 'before',
  currency_precision: 2,
  locations: []
};