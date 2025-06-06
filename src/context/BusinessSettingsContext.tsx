
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const loadSettings = async (showToast = false) => {
    try {
      setLoading(true);
      // Force refresh if we're online to get latest data
      const businessSettings = await getBusinessSettings(isOnline);
      setSettings(businessSettings);
      if (showToast) toast.success('Business settings updated');
    } catch (error) {
      console.error('Failed to load business settings:', error);
      if (showToast) toast.error('Failed to update business settings');
      
      // If we failed and don't have any settings, try to get cached ones
      if (!settings) {
        try {
          const cachedSettings = await getBusinessSettings(false);
          setSettings(cachedSettings);
        } catch (cacheError) {
          console.error('Failed to load cached settings too:', cacheError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Load settings on initial mount
  useEffect(() => {
    if (!settings) {
      loadSettings();
    }
  }, []);

  // Refresh settings when coming back online
  useEffect(() => {
    if (isOnline) {
      loadSettings();
    }
  }, [isOnline]);

  const refreshSettings = async () => {
    await loadSettings(true);
  };

  return (
    <BusinessSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </BusinessSettingsContext.Provider>
  );
};
