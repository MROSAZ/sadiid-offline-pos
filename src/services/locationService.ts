import { getBusinessSettings, BusinessLocation } from '@/lib/businessSettings';
import { getBusinessSettingsFromStorage } from '@/lib/storage';
import { saveBusinessSettings } from '@/lib/storage';
import { toast } from 'sonner';

// Constants
const LOCATION_STORAGE_KEY = 'selected_location_id';

/**
 * Get all available business locations
 * @param activeOnly Only return active locations
 * @param forceRefresh Force refresh from API instead of cache
 */
export const getLocations = async (
  activeOnly = true,
  forceRefresh = false
): Promise<BusinessLocation[]> => {
  try {
    const settings = await getBusinessSettings(forceRefresh);
    
    if (!settings.locations || settings.locations.length === 0) {
      console.warn('No business locations found in settings');
      return [];
    }
    
    return activeOnly 
      ? settings.locations.filter(loc => loc.is_active === 1) 
      : settings.locations;
  } catch (error) {
    console.error('Error getting locations:', error);
    return [];
  }
};

/**
 * Get the currently selected location ID from localStorage
 */
export const getSelectedLocationId = (): number | null => {
  const locationId = localStorage.getItem('selected_location_id');
  return locationId ? parseInt(locationId, 10) : null;
};

/**
 * Get the currently selected location object
 */
export const getSelectedLocation = async (): Promise<BusinessLocation | null> => {
  const locationId = getSelectedLocationId();
  if (!locationId) return null;

  const settings = await getBusinessSettings();
  if (!settings.locations) return null;

  return settings.locations.find(loc => loc.id === locationId) || null;
};

/**
 * Set the selected location ID in localStorage
 */
export const saveSelectedLocationId = (locationId: number): void => {
  try {
    if (!locationId) {
      console.error('Invalid location ID:', locationId);
      return;
    }
    
    // Save to localStorage
    localStorage.setItem(LOCATION_STORAGE_KEY, locationId.toString());
    
    // Also save to IndexedDB for better persistence
    const settings = getBusinessSettingsFromStorage();
    if (settings) {
      settings.default_location_id = locationId;
      saveBusinessSettings(settings);
    }
  } catch (error) {
    console.error('Error saving selected location ID:', error);
    toast.error('Failed to save selected location');
  }
};

/**
 * Check if the provided location ID exists in the active locations
 */
export const isValidLocationId = async (locationId: number): Promise<boolean> => {
  if (!locationId) return false;
  
  try {
    const locations = await getLocations(true);
    return locations.some(loc => loc.id === locationId);
  } catch (error) {
    console.error('Error validating location ID:', error);
    return false;
  }
};

/**
 * Auto-select a business location if none is selected or current selection is invalid
 * @returns The selected location ID
 */
export const autoSelectLocation = async (): Promise<number | null> => {
  try {
    // Get current location ID
    let locationId = getSelectedLocationId();
    
    // Get locations with cached data first
    const locations = await getLocations(true, false);
    
    // If we're offline and no locations found, but have a cached location ID, trust it
    if (locations.length === 0 && !navigator.onLine && locationId) {
      console.warn('Offline mode: Using cached location ID');
      return locationId;
    }
    
    // If no locations found, try forcing a refresh if online
    if (locations.length === 0 && navigator.onLine) {
      console.log('No locations in cache, fetching from server...');
      const freshLocations = await getLocations(true, true);
      if (freshLocations.length === 0) {
        console.warn('No active business locations found');
        return null;
      }
    }
    
    // Validate current selection
    const isValid = locationId && locations.some(loc => loc.id === locationId && loc.is_active === 1);
    
    if (!isValid) {
      // Select first active location
      const firstActiveLocation = locations.find(loc => loc.is_active === 1);
      if (firstActiveLocation) {
        locationId = firstActiveLocation.id;
        saveSelectedLocationId(firstActiveLocation.id);
        console.log(`Auto-selected business location: ${firstActiveLocation.name} (ID: ${firstActiveLocation.id})`);
      } else {
        console.warn('No active locations available');
        return null;
      }
    } else {
      // Even if valid, ensure it's saved to localStorage
      saveSelectedLocationId(locationId);
      const selectedLocation = locations.find(loc => loc.id === locationId);
      console.log(`Confirmed existing business location: ${selectedLocation?.name} (ID: ${locationId})`);
    }
    
    return locationId;
  } catch (error) {
    console.error('Error auto-selecting location:', error);
    // In offline mode, try to use cached location ID as fallback
    if (!navigator.onLine) {
      const cachedId = getSelectedLocationId();
      if (cachedId) {
        console.log('Fallback to cached location ID:', cachedId);
        saveSelectedLocationId(cachedId);
        return cachedId;
      }
    }
    return null;
  }
};

/**
 * Format location address from individual fields
 */
export const formatLocationAddress = (location: BusinessLocation | null): string => {
  if (!location) return '';
  
  const addressParts = [
    location.landmark,
    location.city,
    location.state,
    location.country,
    location.zip_code
  ].filter(Boolean); // Filter out null/undefined/empty values
  
  return addressParts.join(', ');
};

/**
 * Get location by ID
 */
export const getLocationById = async (id: number): Promise<BusinessLocation | null> => {
  if (!id) return null;
  
  try {
    const locations = await getLocations(false);
    return locations.find(loc => loc.id === id) || null;
  } catch (error) {
    console.error('Error getting location by ID:', error);
    return null;
  }
};