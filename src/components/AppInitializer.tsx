
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { autoSelectLocation } from '@/services/locationService';
import { useAuth } from '@/context/AuthContext';
import { syncData } from '@/services/syncService';
import { toast } from 'sonner';

/**
 * AppInitializer handles all essential post-authentication initialization:
 * 1. Auto-selects a business location and updates CartContext
 * 2. Triggers initial data synchronization if needed
 */
const AppInitializer = () => {
  const { setLocation } = useCart();
  const { isAuthenticated } = useAuth();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // Only initialize if authenticated and not already initialized
    if (isAuthenticated && !initialized) {
      const initializeApp = async () => {
        try {
          // Step 1: Auto-select business location
          const locationId = await autoSelectLocation();
          if (locationId) {
            setLocation(locationId);
          }
          
          // Step 2: Check if we need to sync data
          const lastSyncStr = localStorage.getItem('last_sync_timestamp');
          const syncNeeded = !lastSyncStr || 
            (Date.now() - parseInt(lastSyncStr, 10) > 3600000); // Sync if last sync was over 1 hour ago
          
          // Step 3: Sync data if online and needed
          if (navigator.onLine && syncNeeded) {
            console.log('Initial data sync needed, starting sync...');
            await syncData();
            console.log('Initial data sync complete');
          }
          
          // Mark as initialized to prevent repeated execution
          setInitialized(true);
          
        } catch (error) {
          console.error('Error during app initialization:', error);
          toast.error('There was an issue initializing the app');
        }
      };
      
      initializeApp();
    }
  }, [isAuthenticated, setLocation, initialized]);
  
  return null; // This component doesn't render anything
};

export default AppInitializer;
