// src/components/AppInitializer.tsx
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { toast } from 'sonner';
import { autoSelectLocation } from '@/services/locationService';
import { syncData } from '@/services/syncService';
import { getLocalItem, setLocalItem } from '@/services/storage';

const AppInitializer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isOnline } = useNetwork();
  const { setLocation } = useCart();
  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    // Only initialize once after authentication is confirmed
    if (isAuthenticated && !initialized && !initializing) {
      const initialize = async () => {
        setInitializing(true);
        console.log('Starting application initialization...');
        
        try {
          // Step 1: Initialize business location
          try {
            const locationId = await autoSelectLocation();
            if (locationId) {
              setLocation(locationId);
              console.log(`Selected business location: ${locationId}`);
            } else {
              // No location could be selected - show warning
              toast.warning(
                'No active business location found. Some features may be limited.',
                { duration: 5000 }
              );
            }
          } catch (locError) {
            console.error('Location initialization failed:', locError);
          }

          // Step 2: Check if data sync is needed based on timestamp
          if (isOnline) {
            try {
              const lastSyncTimestamp = getLocalItem('last_sync_timestamp');
              const currentTime = Date.now();
              const syncInterval = 1000 * 60 * 60; // 1 hour in milliseconds
              
              // Sync if never synced or last sync was more than the interval ago
              if (!lastSyncTimestamp || (currentTime - parseInt(lastSyncTimestamp, 10)) > syncInterval) {
                console.log('Data sync needed, starting synchronization...');
                const syncToast = toast.loading('Synchronizing data...');
                const success = await syncData();
                
                if (success) {
                  toast.success('Data synchronized successfully', {
                    id: syncToast
                  });
                  setLocalItem('last_sync_timestamp', currentTime.toString());
                } else {
                  toast.error('Data synchronization failed', {
                    id: syncToast
                  });
                }
              } else {
                console.log('Data sync not needed, using cached data');
              }
            } catch (syncError) {
              console.error('Data sync failed:', syncError);
            }
          } else {
            console.log('Offline mode: using locally cached data');
          }
          
          console.log('Application initialization complete');
          setInitialized(true);
        } catch (error) {
          console.error('Error during application initialization:', error);
          toast.error('Some initialization tasks failed. The app may have limited functionality.');
        } finally {
          setInitializing(false);
        }
      };
      
      initialize();
    }
  }, [isAuthenticated, initialized, initializing, isOnline, setLocation]);
  
  // This component doesn't render anything visible
  return null;
};

export default AppInitializer;