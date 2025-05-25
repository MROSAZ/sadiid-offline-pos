import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncData } from '@/services/syncService';
import { toast } from 'sonner';

interface NetworkContextType {
  isOnline: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = async () => {
      console.log('Browser reports online');
      setIsOnline(true);
      
      // Trigger sync when coming back online and user is authenticated
      const token = localStorage.getItem('token');
      if (token) {
        console.log('🔄 Network restored, triggering sync...');
        try {
          await syncData(true);
        } catch (error) {
          console.error('❌ Sync failed after network restore:', error);
          toast.error('Failed to sync data');
        }
      }
    };

    const handleOffline = () => {
      console.log('Browser reports offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
};
