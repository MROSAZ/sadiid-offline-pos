
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { startBackgroundSync, stopBackgroundSync } from '@/services/syncService';

interface NetworkContextType {
  isOnline: boolean;
  lastOnlineTime: Date | null;
  connectionQuality: 'unknown' | 'poor' | 'good' | 'excellent';
  checkServerReachable: () => Promise<boolean>;
  retryOperation: <T>(operation: () => Promise<T>, maxRetries?: number) => Promise<T>;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: navigator.onLine,
  lastOnlineTime: null,
  connectionQuality: 'unknown',
  checkServerReachable: async () => false,
  retryOperation: async (operation) => operation(),
});

export const useNetwork = () => useContext(NetworkContext);

// URL to ping for connectivity check
const PING_URL = 'https://erp.sadiid.net/api/ping';
const PING_INTERVAL_MS = 30000; // 30 seconds
const MAX_DEFAULT_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Base delay between retries

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );
  const [connectionQuality, setConnectionQuality] = useState<'unknown' | 'poor' | 'good' | 'excellent'>('unknown');
  
  const pingIntervalRef = useRef<number | null>(null);
  const networkReconnectedRef = useRef(false);
  
  // More accurate online status check by pinging the server
  const checkServerReachable = async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(PING_URL, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Server ping failed:', error);
      return false;
    }
  };
  
  // Retry operation with exponential backoff
  const retryOperation = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = MAX_DEFAULT_RETRIES
  ): Promise<T> => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wait with exponential backoff before retrying
        if (attempt > 0) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        return await operation();
      } catch (error) {
        console.log(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
        lastError = error;
        
        // If we're offline, break early
        if (!navigator.onLine) {
          console.log('Device is offline. Stopping retry attempts.');
          break;
        }
      }
    }
    
    throw lastError;
  };
  
  // Measure connection quality
  const measureConnectionQuality = () => {
    const connection = (navigator as any).connection;
    
    if (!connection) {
      setConnectionQuality('unknown');
      return;
    }
    
    const { effectiveType, downlink, rtt } = connection;
    
    if (effectiveType === '4g' && downlink >= 5 && rtt < 100) {
      setConnectionQuality('excellent');
    } else if ((effectiveType === '4g' || effectiveType === '3g') && downlink >= 1 && rtt < 300) {
      setConnectionQuality('good');
    } else {
      setConnectionQuality('poor');
    }
  };

  // Start periodic ping to check real connectivity
  const startPeriodicPing = () => {
    // Clear any existing interval
    if (pingIntervalRef.current) {
      window.clearInterval(pingIntervalRef.current);
    }
    
    // Only run ping if browser reports online
    if (navigator.onLine) {
      pingIntervalRef.current = window.setInterval(async () => {
        const reachable = await checkServerReachable();
        setIsOnline(reachable);
        
        if (reachable) {
          setLastOnlineTime(new Date());
          measureConnectionQuality();
        }
      }, PING_INTERVAL_MS);
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      console.log('Browser reports online');
      
      // Verify we can actually reach our server
      const reachable = await checkServerReachable();
      
      if (reachable) {
        setIsOnline(true);
        setLastOnlineTime(new Date());
        measureConnectionQuality();
        
        // Check if we're reconnecting after being offline
        if (!isOnline && !networkReconnectedRef.current) {
          networkReconnectedRef.current = true;
          toast.success('You are back online!');
          
          // Restart background sync
          startBackgroundSync();
        }
      } else {
        console.log('Browser reports online but server is not reachable.');
        setIsOnline(false);
      }
      
      // Start ping regardless of current status
      startPeriodicPing();
    };

    const handleOffline = () => {
      networkReconnectedRef.current = false;
      setIsOnline(false);
      
      // Clear ping interval
      if (pingIntervalRef.current) {
        window.clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      // Stop background sync
      stopBackgroundSync();
      
      toast.error('You are offline. Data will be saved locally.');
    };
    
    // Check connection quality when it changes
    const handleConnectionChange = () => {
      measureConnectionQuality();
    };

    // Initialize
    handleOnline();
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Add connection listener if supported
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
      
      if (pingIntervalRef.current) {
        window.clearInterval(pingIntervalRef.current);
      }
      
      // Make sure background sync is stopped on unmount
      stopBackgroundSync();
    };
  }, []);
  
  // Start background sync when online
  useEffect(() => {
    if (isOnline) {
      startBackgroundSync();
    } else {
      stopBackgroundSync();
    }
    
    return () => {
      stopBackgroundSync();
    };
  }, [isOnline]);

  return (
    <NetworkContext.Provider value={{ 
      isOnline, 
      lastOnlineTime, 
      connectionQuality,
      checkServerReachable,
      retryOperation
    }}>
      {children}
    </NetworkContext.Provider>
  );
};
