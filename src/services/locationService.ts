import { getBusinessSettings, BusinessLocation } from '@/lib/businessSettings';
import { saveSelectedLocationIdToDB, getSelectedLocationIdFromDB } from '@/lib/storage';

/**
 * Get all available business locations.
 * @param activeOnly - Only return active locations.
 * @param forceRefresh - Force refresh from API instead of cache.
 */
export const getLocations = async (
  activeOnly = true,
  forceRefresh = false
): Promise<BusinessLocation[]> => {
  try {
    const settings = await getBusinessSettings(forceRefresh);
    const locations = settings.locations || [];
    return activeOnly ? locations.filter(loc => loc.is_active === 1) : locations;
  } catch (error) {
    console.error('Error getting locations:', error);
    return [];
  }
};

/**
 * Get the currently selected location ID from IndexedDB.
 */
export const getSelectedLocationId = (): Promise<number | null> => {
  return getSelectedLocationIdFromDB();
};

/**
 * Set the selected location ID in IndexedDB.
 */
export const setSelectedLocationId = (locationId: number): Promise<void> => {
  return saveSelectedLocationIdToDB(locationId);
};

/**
 * Get the currently selected location object.
 */
export const getSelectedLocation = async (): Promise<BusinessLocation | null> => {
  const locationId = await getSelectedLocationId();
  if (!locationId) return null;

  const locations = await getLocations(false);
  return locations.find(loc => loc.id === locationId) || null;
};

/**
 * Check if the provided location ID is valid.
 */
export const isValidLocationId = async (locationId: number): Promise<boolean> => {
  if (!locationId) return false;
  const locations = await getLocations(true);
  return locations.some(loc => loc.id === locationId);
};

/**
 * Auto-selects a valid location if the current one is invalid or missing.
 */
export const autoSelectLocation = async (): Promise<number | null> => {
  const locations = await getLocations(true);
  if (locations.length === 0) {
    console.warn('No active business locations found.');
    return null;
  }

  const currentLocationId = await getSelectedLocationId();
  const isValid = currentLocationId && locations.some(loc => loc.id === currentLocationId);

  if (isValid) {
    return currentLocationId;
  }

  const firstLocation = locations[0];
  await setSelectedLocationId(firstLocation.id);
  console.log(`Auto-selected business location: ${firstLocation.name} (ID: ${firstLocation.id})`);
  return firstLocation.id;
};

/**
 * Format location address from individual fields.
 */
export const formatLocationAddress = (location: BusinessLocation | null): string => {
  if (!location) return '';

  return [
    location.landmark,
    location.city,
    location.state,
    location.country,
    location.zip_code
  ].filter(Boolean).join(', ');
};

/**
 * Get location by ID.
 */
export const getLocationById = async (id: number): Promise<BusinessLocation | null> => {
  if (!id) return null;
  const locations = await getLocations(false);
  return locations.find(loc => loc.id === id) || null;
};