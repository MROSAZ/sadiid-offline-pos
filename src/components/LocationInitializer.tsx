import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { autoSelectLocation } from '@/services/locationService';
import { useAuth } from '@/context/AuthContext';

const LocationInitializer = () => {
  const { setLocation } = useCart();
  const { isAuthenticated } = useAuth();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // Only initialize if authenticated and not already initialized
    if (isAuthenticated && !initialized) {
      const initializeLocation = async () => {
        try {
          const locationId = await autoSelectLocation();
          if (locationId) {
            setLocation(locationId);
          }
          // Mark as initialized to prevent repeated execution
          setInitialized(true);
        } catch (error) {
          console.error('Error initializing location:', error);
        }
      };
      
      initializeLocation();
    }
  }, [isAuthenticated, setLocation, initialized]);
  
  return null; // This component doesn't render anything
};

export default LocationInitializer;