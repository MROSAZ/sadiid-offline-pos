// src/components/AppInitializer.tsx
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext';
import { useCustomer } from '@/context/CustomerContext';
import { syncData } from '@/services/syncService';
import { getContacts } from '@/services/storage';
import { autoSelectLocation } from '@/services/locationService';

/**
 * Component that handles application initialization tasks
 * - Data synchronization when coming online
 * - Loading customer data
 * - Auto-selecting business location
 */
const AppInitializer: React.FC = () => {
  const { isOnline } = useNetwork();
  const { setCustomers } = useCustomer();
  const [initialized, setInitialized] = useState(false);

  // Initial data loading and synchronization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Only sync with server if online
        if (isOnline) {
          await syncData();
        }

        // Auto-select business location if none selected
        await autoSelectLocation();

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
  }, [isOnline, setCustomers, initialized]);

  // Sync data when coming back online
  useEffect(() => {
    if (isOnline && initialized) {
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
    }
  }, [isOnline, initialized, setCustomers]);

  // This component doesn't render anything
  return null;
};

export default AppInitializer;