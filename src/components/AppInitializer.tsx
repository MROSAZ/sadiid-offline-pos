
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext';
import { useCustomer } from '@/context/CustomerContext';
import { useCart } from '@/context/CartContext';
import { syncData } from '@/services/syncService';
import { getContacts, getProducts } from '@/services/storage';
import { autoSelectLocation } from '@/services/locationService';
import { getBusinessSettings } from '@/services/businessSettings';

/**
 * Enhanced AppInitializer component that handles application initialization tasks
 */
const AppInitializer: React.FC = () => {
  const { isOnline, retryOperation } = useNetwork();
  const { setCustomers } = useCustomer();
  const { setLocation } = useCart();
  const [initialized, setInitialized] = useState(false);
  const [initializationAttempts, setInitializationAttempts] = useState(0);

  // Initial data loading and synchronization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log(`Initializing app (attempt ${initializationAttempts + 1})...`);

        // Step 1: Auto-select business location if none selected
        const locationId = await autoSelectLocation();
        if (locationId) {
          console.log(`Selected location: ${locationId}`);
          setLocation(locationId);
        } else {
          console.warn('No location could be selected');
        }

        // Step 2: Load business settings from cache
        try {
          await getBusinessSettings(false);
          console.log('Business settings loaded from cache');
        } catch (error) {
          console.warn('Failed to load business settings from cache', error);
        }

        // Step 3: Load existing customer data into context
        try {
          const contacts = await getContacts();
          setCustomers(contacts || []);
          console.log(`Loaded ${contacts?.length || 0} contacts from storage`);
        } catch (error) {
          console.warn('Failed to load contacts from storage', error);
          setCustomers([]);
        }

        // Step 4: Check if we have products cached
        try {
          const products = await getProducts();
          console.log(`Found ${products?.length || 0} products in storage`);
        } catch (error) {
          console.warn('Failed to check products in storage', error);
        }

        // Step 5: Only sync with server if online
        if (isOnline) {
          console.log('Online, syncing with server...');
          await retryOperation(async () => {
            const syncResult = await syncData(false, initializationAttempts > 0);
            if (syncResult) {
              console.log('Initial sync completed successfully');
            } else {
              console.warn('Initial sync failed or was skipped');
            }
            return syncResult;
          }, 2);
          
          // Refresh customer data after sync
          const updatedContacts = await getContacts();
          setCustomers(updatedContacts || []);
        } else {
          console.log('Offline, skipping initial sync');
        }

        setInitialized(true);
      } catch (error) {
        console.error('Error initializing application:', error);
        
        setInitializationAttempts(prev => prev + 1);
        
        if (initializationAttempts < 3) {
          setTimeout(() => {
            setInitialized(false);
          }, 5000);
          
          toast.error('App initialization issue. Retrying...');
        } else {
          setInitialized(true);
          toast.error('Failed to initialize some app features. Some functionality may be limited.');
        }
      }
    };

    if (!initialized) {
      initializeApp();
    }
  }, [isOnline, setCustomers, initialized, setLocation, retryOperation, initializationAttempts]);

  // Sync data when coming back online
  useEffect(() => {
    if (isOnline && initialized) {
      const refreshData = async () => {
        try {
          await syncData(true);
          
          const contacts = await getContacts();
          setCustomers(contacts || []);
        } catch (error) {
          console.error('Error syncing data after coming online:', error);
        }
      };
      
      refreshData();
    }
  }, [isOnline, initialized, setCustomers]);

  return null;
};

export default AppInitializer;
