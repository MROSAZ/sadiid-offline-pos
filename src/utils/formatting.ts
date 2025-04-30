// Simplify formatters with memoization for performance
import { getBusinessSettings } from '@/services/businessSettings';

// Cache for formatting functions
const formatCache = new Map<string, string>();
const CACHE_SIZE_LIMIT = 1000;

/**
 * Format number with proper separators and precision
 */
export const formatNumber = (
  value: number | string,
  settings: any,
  precision?: number
): string => {
  if (value === null || value === undefined || value === '') return '0';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0';
  
  // Use specified precision or default from settings
  const actualPrecision = precision !== undefined ? precision : settings.currency_precision;
  
  // Apply rounding if specified
  const roundingMethod = settings.pos_settings?.amount_rounding_method;
  let roundedValue = numValue;
  
  if (roundingMethod && roundingMethod !== '0') {
    const roundTo = parseFloat(roundingMethod);
    if (!isNaN(roundTo) && roundTo > 0) {
      roundedValue = Math.round(numValue / roundTo) * roundTo;
    }
  }
  
  // Format with proper separators
  return roundedValue.toFixed(actualPrecision)
    .replace('.', '<DECIMAL>')
    .replace(/,/g, settings.currency.thousand_separator || ',')
    .replace('<DECIMAL>', settings.currency.decimal_separator || '.');
};

/**
 * Format as currency with proper symbol and position
 */
export const formatCurrencySync = (
  value: number | string, 
  settings: any
): string => {
  // Generate cache key
  const cacheKey = `currency:${value}:${settings.currency_precision}:${settings.currency_symbol_placement}`;
  
  // Return from cache if available
  if (formatCache.has(cacheKey)) {
    return formatCache.get(cacheKey)!;
  }
  
  if (!value || value === '') return 'N/A';
  
  try {
    const formattedNumber = formatNumber(value, settings);
    const result = settings.currency_symbol_placement === 'before'
      ? `${settings.currency.symbol}${formattedNumber}`
      : `${formattedNumber} ${settings.currency.symbol}`;
    
    // Cache result if cache isn't too large
    if (formatCache.size < CACHE_SIZE_LIMIT) {
      formatCache.set(cacheKey, result);
    }
    
    return result;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return String(value);
  }
};

// Async wrapper for currency formatting
export const formatCurrency = async (value: number | string): Promise<string> => {
  const settings = await getBusinessSettings();
  return formatCurrencySync(value, settings);
};

// Format quantity with proper precision
export const formatQuantity = async (value: number | string): Promise<string> => {
  const settings = await getBusinessSettings();
  return formatNumber(value, settings, settings.quantity_precision);
};