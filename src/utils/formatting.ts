import { BusinessSettings, CurrencyInfo } from '@/types/businessTypes';
import { getBusinessSettings } from '@/services/storage';

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
  
  const { 
    currency, 
    currency_precision: precision, 
    currency_symbol_placement: placement 
  } = settings;
  
  const { 
    symbol, 
    thousand_separator, 
    decimal_separator 
  } = currency;
  
  // Format the number part
  const formattedNumber = formatNumberWithSeparators(
    numericAmount,
    precision,
    thousand_separator,
    decimal_separator
  );
  
  // Add symbol in correct position
  if (placement === 'before') {
    return `${symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber}${symbol}`;
  }
};

/**
 * Format a number with separators
 */
export const formatNumberWithSeparators = (
  value: number,
  precision: number,
  thousandSeparator: string,
  decimalSeparator: string
): string => {
  const fixed = value.toFixed(precision);
  const [whole, decimal] = fixed.split('.');
  
  // Add thousand separators to the whole number part
  const wholePart = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  
  // Combine with decimal part if it exists
  if (decimal !== undefined) {
    return `${wholePart}${decimalSeparator}${decimal}`;
  } else {
    return wholePart;
  }
};

/**
 * Format a date as a string in the locale format
 * @param date - Date to format or date string
 * @param format - Optional format string ('short', 'medium', 'long', or Intl.DateTimeFormatOptions)
 * @param locale - Optional locale string (default: 'en-US')
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' | Intl.DateTimeFormatOptions = 'medium',
  locale: string = 'en-US'
): string => {
  // Convert to Date object if string
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Check for invalid date
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  // Format based on the requested format
  let formatOptions: Intl.DateTimeFormatOptions;
  
  if (typeof format === 'string') {
    switch (format) {
      case 'short':
        formatOptions = { 
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric' 
        };
        break;
      case 'medium':
        formatOptions = { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        };
        break;
      case 'long':
        formatOptions = { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        break;
      default:
        formatOptions = { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        };
    }
  } else {
    formatOptions = format;
  }
  
  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
};

/**
 * Format a number as a quantity with specified precision
 * @param quantity - Number to format
 * @param settings - Business settings containing quantity precision
 * @returns Formatted quantity string
 */
export const formatQuantity = (
  quantity: number | string,
  settings: BusinessSettings
): string => {
  // Handle non-number inputs
  const numericQuantity = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  
  if (isNaN(numericQuantity)) {
    return 'N/A';
  }
  
  const { quantity_precision } = settings;
  
  // Format the quantity with proper decimal places
  return formatNumberWithSeparators(
    numericQuantity,
    quantity_precision,
    ',',
    '.'
  );
};

/**
 * Format a phone number according to common patterns
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    // US format: (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    // US with country code: 1 (XXX) XXX-XXXX
    return `1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else {
    // For other formats, just add spaces for readability
    // Group in chunks of 3 or 4 digits
    return cleaned.replace(/(\d{3,4})(?=\d)/g, '$1 ');
  }
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if necessary
 */
export const truncateText = (text: string, maxLength: number = 30): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};