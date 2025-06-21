import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getBusinessSettings, 
  getLocalBusinessSettings,
  BusinessSettings as BusinessSettingsType 
} from '@/lib/businessSettings';
import { useNetwork } from './NetworkContext';
import { toast } from 'sonner';

interface BusinessSettingsContextType {
  settings: BusinessSettingsType | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const BusinessSettingsContext = createContext<BusinessSettingsContextType>({
  settings: null,
  loading: true,
  refreshSettings: async () => {}
});

export const useBusinessSettings = () => useContext(BusinessSettingsContext);

interface BusinessSettingsProviderProps {
  children: React.ReactNode;
}

export const BusinessSettingsProvider: React.FC<BusinessSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<BusinessSettingsType | null>(getLocalBusinessSettings());
  const [loading, setLoading] = useState(!settings);
  const { isOnline } = useNetwork();

  const loadSettings = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const businessSettings = await getBusinessSettings(forceRefresh);
      setSettings(businessSettings);
    } catch (error) {
      console.error('Failed to load business settings:', error);
      toast.error('Failed to load business settings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings on initial mount
  useEffect(() => {
    if (!settings) {
      loadSettings(isOnline);
    }
  }, [loadSettings, settings, isOnline]);

  // Refresh settings when coming back online
  useEffect(() => {
    if (isOnline) {
      loadSettings(true);
    }
  }, [isOnline, loadSettings]);

  const refreshSettings = useCallback(async () => {
    await loadSettings(true);
    toast.success('Business settings updated');
  }, [loadSettings]);

  return (
    <BusinessSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </BusinessSettingsContext.Provider>
  );
};
