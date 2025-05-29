import { getBusinessSettings, BusinessLocation } from '@/lib/businessSettings';
import { saveSelectedLocation, getSelectedLocationFromDB } from '@/lib/storage'; // Fixed: Updated import name

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
 * Get the currently selected location ID from localStorage/IndexedDB
 */
export const getSelectedLocationId = async (): Promise<number | null> => {
  try {
    // Try IndexedDB first, fallback to localStorage
    const locationId = await getSelectedLocationFromDB(); // Fixed: Use renamed function
    if (locationId !== null) {
      return locationId;
    }
    
    // Fallback to localStorage
    const storedId = localStorage.getItem(LOCATION_STORAGE_KEY);
    return storedId ? parseInt(storedId, 10) : null;
  } catch (error) {
    console.error('Error getting selected location ID:', error);
    // Fallback to localStorage only
    const storedId = localStorage.getItem(LOCATION_STORAGE_KEY);
    return storedId ? parseInt(storedId, 10) : null;
  }
};

/**
 * Get the currently selected location object
 */
export const getSelectedLocationObject = async (): Promise<BusinessLocation | null> => { // Fixed: Renamed to avoid conflict
  const locationId = await getSelectedLocationId();
  if (!locationId) return null;

  const settings = await getBusinessSettings();
  if (!settings.locations) return null;

  return settings.locations.find(loc => loc.id === locationId) || null;
};

/**
 * Set the selected location ID in localStorage and IndexedDB
 */
export const saveSelectedLocationId = async (locationId: number): Promise<void> => {
  try {
    // Save to both localStorage (fallback) and IndexedDB (primary)
    localStorage.setItem(LOCATION_STORAGE_KEY, locationId.toString());
    await saveSelectedLocation(locationId);
  } catch (error) {
    console.error('Error saving selected location ID:', error);
    // Fallback to localStorage only
    localStorage.setItem(LOCATION_STORAGE_KEY, locationId.toString());
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
    let locationId = await getSelectedLocationId();
    
    // Check if current selection is valid
    const locations = await getLocations(true); // Use cached data
    
    // If we're offline and no locations found, but have a cached location ID, trust it
    if (locations.length === 0 && !navigator.onLine && locationId) {
      console.warn('Offline mode: Using cached location ID');
      return locationId;
    }
    
    if (locations.length === 0) {
      console.warn('No active business locations found');
      return null;
    }
    
    // If no location selected or invalid selection, select first active one
    const isValid = locationId && locations.some(loc => loc.id === locationId);
    if (!isValid) {
      const firstLocation = locations[0];
      locationId = firstLocation.id;
      await saveSelectedLocationId(firstLocation.id); // Fixed: Added await
      console.log(`Auto-selected business location: ${firstLocation.name} (ID: ${firstLocation.id})`);
    } else {
      // Even if valid, ensure it's saved to localStorage (in case it was cleared)
      await saveSelectedLocationId(locationId); // Fixed: Added await
      console.log(`Confirmed existing business location: ${locations.find(loc => loc.id === locationId)?.name} (ID: ${locationId})`);
    }
    
    return locationId;
  } catch (error) {
    console.error('Error auto-selecting location:', error);
    // In offline mode, try to use cached location ID as fallback
    if (!navigator.onLine) {
      const cachedId = await getSelectedLocationId();
      if (cachedId) {
        console.log('Fallback to cached location ID:', cachedId);
        // Ensure it's saved even in fallback scenario
        await saveSelectedLocationId(cachedId); // Fixed: Added await
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