import { getBusinessSettings } from '@/services/businessSettings';

/**
 * Formats a number according to business settings
 * @param value - Number value to format
 * @param precision - Override the default precision
 * @returns Formatted number string
 */
export const formatNumber = async (
  value: number | string,
  precision?: number
): Promise<string> => {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  
  const settings = await getBusinessSettings();
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  const actualPrecision = precision !== undefined ? precision : settings.currency_precision;
  
  // Apply rounding if specified in settings
  let roundedValue = numValue;
  const roundingMethod = settings.pos_settings.amount_rounding_method;
  
  if (roundingMethod && roundingMethod !== '0') {
    const roundTo = parseFloat(roundingMethod);
    if (!isNaN(roundTo) && roundTo > 0) {
      roundedValue = Math.round(numValue / roundTo) * roundTo;
    }
  }
  
  // Format the number with the correct separators
  const formatted = roundedValue.toFixed(actualPrecision);
  
  // Replace with the correct separators (default separators are '.' and ',')
  return formatted
    .replace('.', '<DECIMAL>')
    .replace(/,/g, settings.currency.thousand_separator)
    .replace('<DECIMAL>', settings.currency.decimal_separator);
};

/**
 * Formats a value as currency with the correct symbol and placement
 * @param value - Number value to format as currency
 * @returns Formatted currency string
 */
export const formatCurrency = async (value: number | string): Promise<string> => {
  const settings = await getBusinessSettings();
  const formattedNumber = await formatNumber(value);
  
  return settings.currency_symbol_placement === 'before'
    ? `${settings.currency.symbol}${formattedNumber}`
    : `${formattedNumber} ${settings.currency.symbol}`;
};

/**
 * Formats a quantity with the business-defined quantity precision
 * @param value - Quantity value to format
 * @returns Formatted quantity string
 */
export const formatQuantity = async (value: number | string): Promise<string> => {
  const settings = await getBusinessSettings();
  return formatNumber(value, settings.quantity_precision);
};

/**
 * Synchronous version of formatCurrency for direct use in components
 * Use this when businessSettings is already available
 * @param value - Number value to format as currency
 * @param settings - Business settings object 
 * @returns Formatted currency string
 */
export const formatCurrencySync = (
  value: number | string, 
  settings: { 
    currency: { symbol: string; decimal_separator: string; thousand_separator: string },
    currency_symbol_placement: 'before' | 'after',
    currency_precision: number
  }
): string => {
  if (!value || value === '') return 'N/A';
  
  try {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'N/A';
    
    // Format with proper precision
    const formatted = numValue.toFixed(settings.currency_precision)
      .replace('.', '<DECIMAL>')
      .replace(/,/g, settings.currency.thousand_separator)
      .replace('<DECIMAL>', settings.currency.decimal_separator);
    
    // Add currency symbol in correct position
    return settings.currency_symbol_placement === 'before' 
      ? `${settings.currency.symbol}${formatted}`
      : `${formatted} ${settings.currency.symbol}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return String(value);
  }
};