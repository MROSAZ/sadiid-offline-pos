// src/components/AppInitializer.tsx
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext';
import { useCustomer } from '@/context/CustomerContext';
import { syncData } from '@/services/syncService';
import { getContacts, getBusinessSettings } from '@/services/storage';
import { useCart } from '@/context/CartContext';

// Constants
const LOCATION_STORAGE_KEY = 'selected_location_id';

/**
 * Component that handles application initialization tasks
 * - Data synchronization when coming online
 * - Loading customer data
 * - Setting business location
 */
const AppInitializer: React.FC = () => {
  const { isOnline } = useNetwork();
  const { setCustomers } = useCustomer();
  const { setLocation } = useCart();
  const [initialized, setInitialized] = useState(false);

  // Initial data loading and synchronization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Only sync with server if online
        if (isOnline) {
          await syncData();
        }

        // Auto-select a business location from storage or default to first available
        const settings = await getBusinessSettings();
        let locationId = null;
        
        try {
          // Try to get the stored location ID
          const storedId = localStorage.getItem(LOCATION_STORAGE_KEY);
          if (storedId) {
            locationId = parseInt(storedId, 10);
            
            // Validate the location ID exists
            const isValid = settings.locations && 
              settings.locations.some(loc => loc.id === locationId && loc.is_active === 1);
            
            if (!isValid) {
              locationId = null;
            }
          }
        } catch (e) {
          console.error('Error reading location from storage:', e);
        }
        
        // If no valid location ID was found, use the first active location
        if (!locationId && settings.locations && settings.locations.length > 0) {
          const activeLocations = settings.locations.filter(loc => loc.is_active === 1);
          if (activeLocations.length > 0) {
            locationId = activeLocations[0].id;
            localStorage.setItem(LOCATION_STORAGE_KEY, locationId.toString());
          }
        }
        
        // Update cart with the selected location
        if (locationId) {
          setLocation(locationId);
        }

        // Load customer data into context
        const contacts = await getContacts();
        setCustomers(contacts || []);

        // Mark initialization as complete
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing application:', error);
        toast.error('Failed to initialize application properly');
      }
    };

    if (!initialized) {
      initializeApp();
    }
  }, [isOnline, setCustomers, initialized, setLocation]);

  // Sync data when coming back online
  useEffect(() => {
    if (isOnline && initialized) {
      syncData()
        .then(() => getContacts())
        .then((contacts) => setCustomers(contacts || []))
        .catch((error) => console.error('Error syncing data:', error));
    }
  }, [isOnline, initialized, setCustomers]);

  // This component doesn't render anything
  return null;
};

export default AppInitializer;