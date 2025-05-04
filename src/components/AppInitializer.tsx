// src/components/AppInitializer.tsx
import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { getDefaultLocationId } from '../services/locationService';
import { getProducts, getContacts } from '../services/storage';
import { toast } from 'sonner';
import { useNetwork } from '../context/NetworkContext';

const AppInitializer: React.FC = () => {
  const { isOnline } = useNetwork();
  const { setLocation } = useCart();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Set default location
        const locationId = await getDefaultLocationId();
        if (locationId) {
          setLocation(locationId);
        } else {
          toast.error('No business location available');
        }

        // Pre-load products and contacts from storage
        await getProducts();
        await getContacts();
      } catch (error) {
        console.error('Error initializing app:', error);
        toast.error('Failed to initialize the application');
      }
    };

    initializeApp();
  }, [setLocation]);

  return null; // This component doesn't render anything
};

export default AppInitializer;