// src/services/locationService.ts
import { getBusinessSettings } from './businessSettings';
import { getLocalItem, setLocalItem } from './storage';

const LOCATION_STORAGE_KEY = 'selected_location_id';

export const getDefaultLocationId = async (): Promise<number | null> => {
  try {
    // First check if we have a saved location in localStorage
    const savedLocationId = getLocalItem(LOCATION_STORAGE_KEY);
    
    if (savedLocationId) {
      return parseInt(savedLocationId, 10);
    }
    
    // If no saved location, get business settings and use first active location
    const settings = await getBusinessSettings();
    if (settings && settings.locations && settings.locations.length > 0) {
      const activeLocations = settings.locations.filter(loc => loc.is_active === 1);
      if (activeLocations.length > 0) {
        const firstLocation = activeLocations[0];
        setLocalItem(LOCATION_STORAGE_KEY, firstLocation.id.toString());
        return firstLocation.id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting default location:', error);
    return null;
  }
};

export const saveSelectedLocation = (locationId: number): void => {
  setLocalItem(LOCATION_STORAGE_KEY, locationId.toString());
};