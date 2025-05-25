// src/components/AppInitializer.tsx
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext';
import { useCustomer } from '@/context/CustomerContext';
import { useCart } from '@/context/CartContext';
import { syncData } from '@/services/syncService';
import { getContacts } from '@/services/storage';
import { autoSelectLocation } from '@/services/locationService';
import { initBusinessSettings } from '@/services/businessSettings';
import { startBackgroundSync, stopBackgroundSync } from '@/services/backgroundSync';

/**
 * Component that handles application initialization tasks
 * - Data synchronization when coming online
 * - Loading customer data
 * - Auto-selecting business location
 */
const AppInitializer: React.FC = () => {
  const { isOnline } = useNetwork();
  const { setCustomers } = useCustomer();
  const { setLocation } = useCart(); // Add this
  const [initialized, setInitialized] = useState(false);

  // Initial data loading and synchronization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize business settings first (this will use cached data if available)
        await initBusinessSettings();
        
        // Auto-select business location if none selected
        const selectedLocationId = await autoSelectLocation();
        
        // Update cart context with the auto-selected location
        if (selectedLocationId) {
          setLocation(selectedLocationId);
        }

        // Load customer data into context (from local storage)
        const contacts = await getContacts();
        setCustomers(contacts || []);
        
        // Only sync data with server if online (in background)
        if (isOnline) {
          syncData().catch(error => {
            console.error('Background sync failed:', error);
          });
        }

        // Mark initialization as complete - don't block UI on sync
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing application:', error);
        toast.error('Failed to initialize application properly');
      }
    };

    if (!initialized) {
      initializeApp();
    }
  }, [isOnline, setCustomers, setLocation, initialized]); // Add setLocation to dependencies
  // Sync data when coming back online and start background sync
  useEffect(() => {
    if (isOnline && initialized) {
      // Immediate sync when coming back online
      syncData()
        .then(() => {
          // Refresh customer data after sync
          return getContacts();
        })
        .then((contacts) => {
          setCustomers(contacts || []);
        })
        .catch((error) => {
          console.error('Error syncing data:', error);
        });
      
      // Start background sync for periodic updates
      startBackgroundSync();
    } else if (!isOnline) {
      // Stop background sync when offline
      stopBackgroundSync();
    }
    
    // Clean up on unmount
    return () => {
      stopBackgroundSync();
    };
  }, [isOnline, initialized, setCustomers]);

  // This component doesn't render anything
  return null;
};

export default AppInitializer;