import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCustomer } from '@/context/CustomerContext';
import { useCart } from '@/context/CartContext';
import { useNetwork } from '@/context/NetworkContext';
import { autoSelectLocation } from '@/services/locationService';
import { getContacts } from '@/lib/storage';
import { backgroundSync } from '@/services/syncService';

const AppInitializer: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { setLocation } = useCart();
  const { refreshCustomers } = useCustomer();
  const { isOnline } = useNetwork();
  const [initialized, setInitialized] = useState(false);

  // One-time initialization
  useEffect(() => {
    const initialize = async () => {
      if (initialized) return;
      
      try {
        console.log('🚀 Initializing app...');
        
        // Auto-select location
        const locationId = await autoSelectLocation();
        if (locationId) {
          setLocation(locationId);
          console.log(`📍 Location set: ${locationId}`);
        }
        
        // Load cached customers
        try {
          const cachedContacts = await getContacts();
          console.log(`👥 Found ${cachedContacts?.length || 0} cached customers`);
        } catch (error) {
          console.warn('No cached customers found');
        }
        
        console.log('✅ App initialized');
        setInitialized(true);
        
      } catch (error) {
        console.error('❌ Initialization failed:', error);
        setInitialized(true); // Don't block the app
      }
    };

    initialize();
  }, [initialized, setLocation]);

  // Background sync when online and authenticated
  useEffect(() => {
    if (isOnline && isAuthenticated && initialized) {
      const runBackgroundSync = async () => {
        try {
          await backgroundSync();
          await refreshCustomers();
        } catch (error) {
          console.error('Background sync failed:', error);
        }
      };

      // Run immediately and then every 5 minutes
      runBackgroundSync();
      const interval = setInterval(runBackgroundSync, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isOnline, isAuthenticated, initialized, refreshCustomers]);

  return null;
};

export default AppInitializer;
