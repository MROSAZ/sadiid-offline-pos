import { BusinessSettings, CurrencyInfo } from '@/lib/businessSettings';

/**
 * Format a number as currency based on business settings
 * @param value - Number or string to format
 * @param settings - Business settings with currency configuration
 */
export const formatCurrency = async (
  value: number | string,
  businessSettings?: BusinessSettings | null
): Promise<string> => {
  if (!businessSettings) {
    // Dynamic import to avoid circular dependencies
    const { getBusinessSettings } = await import('@/lib/businessSettings');
    businessSettings = await getBusinessSettings();
  }
  
  return formatCurrencySync(value, businessSettings);
};

/**
 * Format a number as currency synchronously (no async operations)
 * @param amount - Number to format
 * @param settings - Business settings containing currency info
 * @returns Formatted currency string
 */
export const formatCurrencySync = (
  amount: number | string,
  settings: BusinessSettings
): string => {
  // Handle non-number inputs
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return 'N/A';
  }
  
  // Extract formatting options
  const {
    currency,
    currency_symbol_placement,
    currency_precision
  } = settings;
  
  // Format the number with proper decimal places
  const formattedNumber = formatNumberWithPrecision(
    numericAmount,
    currency_precision,
    currency.decimal_separator,
    currency.thousand_separator
  );
  
  // Build the formatted currency with proper symbol placement
  if (currency_symbol_placement === 'before') {
    return `${currency.symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber} ${currency.symbol}`;
  }
};

/**
 * Format a number with specified precision and separators
 * @param amount - Number to format
 * @param precision - Number of decimal places
 * @param decimalSeparator - Character to use as decimal separator
 * @param thousandSeparator - Character to use as thousand separator
 * @returns Formatted number string
 */
export const formatNumberWithPrecision = (
  amount: number,
  precision: number = 2,
  decimalSeparator: string = '.',
  thousandSeparator: string = ','
): string => {
  // Round to specified precision
  const roundedAmount = Math.round(amount * Math.pow(10, precision)) / Math.pow(10, precision);
  
  // Convert to string with fixed precision
  let parts = roundedAmount.toFixed(precision).split('.');
  
  // Format the integer part with thousand separators
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  
  // Join with decimal separator
  return parts.join(decimalSeparator);
};