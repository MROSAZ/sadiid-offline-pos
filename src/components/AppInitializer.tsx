
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext';
import { useCustomer } from '@/context/CustomerContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { syncDataOnLogin } from '@/services/syncService';
import { getContacts, getProducts } from '@/lib/storage';
import { autoSelectLocation } from '@/services/locationService';
import { getBusinessSettings } from '@/lib/businessSettings';

/**
 * Enhanced AppInitializer component that handles application initialization tasks:
 * - Data synchronization when coming online and after login
 * - Loading customer data
 * - Auto-selecting business location
 * - Initializing offline data
 * - Authentication-aware re-initialization
 */
const AppInitializer: React.FC = () => {
  const { isOnline, retryOperation } = useNetwork();
  const { refreshCustomers } = useCustomer();
  const { setLocation } = useCart();
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Re-initialize when user changes (login/logout/switch user)
  useEffect(() => {
    const currentUserId = user?.id?.toString() || null;
    
    if (currentUserId !== lastUserId) {
      console.log(`👤 User changed from ${lastUserId} to ${currentUserId} - re-initializing...`);
      setInitialized(false);
      setInitializationAttempts(0);
      setLastUserId(currentUserId);
    }
  }, [user?.id, lastUserId]);

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
        }        // Step 3: Load existing customer data into context
        try {
          const contacts = await getContacts();
          await refreshCustomers();
          console.log(`Loaded ${contacts?.length || 0} contacts from storage`);
        } catch (error) {
          console.warn('Failed to load contacts from storage', error);
        }

        // Step 4: Check if we have products cached
        try {
          const products = await getProducts();
          console.log(`Found ${products?.length || 0} products in storage`);
        } catch (error) {
          console.warn('Failed to check products in storage', error);
        }        // Step 5: Only sync with server if online and user is authenticated
        if (isOnline && user) {
          console.log('🔄 Online and authenticated, performing login sync...');
          await retryOperation(async () => {
            const syncResult = await syncDataOnLogin(initializationAttempts > 0);
            if (syncResult) {
              console.log('✅ Login sync completed successfully');
            } else {
              console.warn('⚠️ Login sync failed or was skipped');
            }
            return syncResult;
          }, 2); // Retry up to 2 times
          
          // Refresh customer data after sync
          await refreshCustomers();
        } else if (!isOnline) {
          console.log('📴 Offline, skipping login sync');
        } else {
          console.log('🔐 Not authenticated, skipping login sync');
        }

        // Mark initialization as complete
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing application:', error);
        
        // If we failed, increment attempts counter
        setInitializationAttempts(prev => prev + 1);
        
        if (initializationAttempts < 3) {
          // Try again after a delay
          setTimeout(() => {
            setInitialized(false); // Reset to trigger another attempt
          }, 5000);
          
          toast.error('App initialization issue. Retrying...');
        } else {
          // After 3 attempts, give up but mark as initialized to avoid blocking app
          setInitialized(true);
          toast.error('Failed to initialize some app features. Some functionality may be limited.');
        }
      }
    };

    if (!initialized) {
      initializeApp();
    }
  }, [isOnline, refreshCustomers, initialized, setLocation, retryOperation, initializationAttempts]);
  // Sync data when coming back online
  useEffect(() => {
    if (isOnline && initialized && user) {
      const refreshData = async () => {
        try {
          await syncDataOnLogin(true);
          // Refresh customer data after sync
          await refreshCustomers();
        } catch (error) {
          console.error('Error syncing data after coming online:', error);
        }
      };
        refreshData();
    }
  }, [isOnline, initialized, refreshCustomers, user]);

  // This component doesn't render anything
  return null;
};

export default AppInitializer;
