
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NetworkContextType {
  isOnline: boolean;
  lastOnlineTime: Date | null;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: navigator.onLine,
  lastOnlineTime: null,
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineTime(new Date());
      toast.success('You are back online!');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Data will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline, lastOnlineTime }}>
      {children}
    </NetworkContext.Provider>
  );
};
