import { BusinessSettings, CurrencyInfo, getLocalBusinessSettings } from '@/lib/businessSettings';

/**
 * 🎨 Sadiid Offline POS - Formatting Utilities
 * 
 * Single source of truth for all formatting functions used throughout the application.
 * This module provides consistent, business-aware formatting for currency, dates, and data.
 * 
 * Features:
 * - 💰 Currency formatting with business settings
 * - 📅 Date formatting in business timezone
 * - 🔢 Number formatting with precision control
 * - 🚨 Error message formatting for user display
 */

// ============================================================================
// 💰 CURRENCY FORMATTING
// ============================================================================

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

// ============================================================================
// 📅 DATE FORMATTING
// ============================================================================

/**
 * Format a date for display in business timezone
 * @param date Date to format
 * @param format Display format options
 * @returns Formatted date string
 */
export const formatBusinessDate = (
  date: Date | string, 
  format: Intl.DateTimeFormatOptions = {}
): string => {
  try {
    const settings = getLocalBusinessSettings();
    const timezone = settings?.timezone || 'UTC';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultFormat: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...format
    };
    
    return new Intl.DateTimeFormat('en-US', defaultFormat).format(dateObj);
    
  } catch (error) {
    console.error('Error formatting business date:', error);
    return new Date(date).toLocaleString();
  }
};

/**
 * Get current date/time in business timezone as ISO string
 * @returns ISO string in business timezone (or UTC if timezone not available)
 */
export const getBusinessTimestamp = (): string => {
  try {
    const settings = getLocalBusinessSettings();
    const timezone = settings?.timezone || 'UTC';
    
    // Create date in business timezone
    const now = new Date();
    
    // If timezone is UTC, return standard ISO string
    if (timezone === 'UTC') {
      return now.toISOString();
    }
    
    // For other timezones, create localized ISO string
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    const parts = formatter.formatToParts(now);
    
    // Build ISO-like string: YYYY-MM-DDTHH:mm:ss
    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;
    const hour = parts.find(part => part.type === 'hour')?.value;
    const minute = parts.find(part => part.type === 'minute')?.value;
    const second = parts.find(part => part.type === 'second')?.value;
    
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    
  } catch (error) {
    console.error('Error getting business timestamp:', error);
    // Fallback to UTC
    return new Date().toISOString();
  }
};

// ============================================================================
// 🚨 ERROR FORMATTING
// ============================================================================

/**
 * Parse API errors for user-friendly messages
 * @param error - Error object from API calls
 * @returns User-friendly error message
 */
export const parseApiError = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unknown error occurred';
};

// ============================================================================
// 📋 UTILITY FUNCTIONS
// ============================================================================

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

/**
 * Format phone number for display
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Apply common phone number formatting
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  } else if (cleaned.length === 8) {
    // Tunisia landline format
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
  }
  
  // Return as-is if doesn't match common patterns
  return phone;
};