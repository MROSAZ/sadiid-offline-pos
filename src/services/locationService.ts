import { getBusinessSettings, BusinessLocation } from '@/services/businessSettings';

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
    localStorage.setItem(LOCATION_STORAGE_KEY, locationId.toString());
  } catch (error) {
    console.error('Error saving selected location ID to localStorage:', error);
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
    
    // Check if current selection is valid
    const locations = await getLocations(true);
    if (locations.length === 0) {
      console.warn('No active business locations found');
      return null;
    }
    
    // If no location selected or invalid selection, select first active one
    const isValid = locationId && locations.some(loc => loc.id === locationId);
    if (!isValid) {
      const firstLocation = locations[0];
      locationId = firstLocation.id;
      saveSelectedLocationId(firstLocation.id);
      console.log(`Auto-selected business location: ${firstLocation.name} (ID: ${firstLocation.id})`);
    }
    
    return locationId;
  } catch (error) {
    console.error('Error auto-selecting location:', error);
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