import { getLocalBusinessSettings } from '@/lib/businessSettings';

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