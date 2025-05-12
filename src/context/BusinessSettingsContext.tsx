import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { 
  getBusinessSettings, 
  getLocalBusinessSettings,
  BusinessSettings as BusinessSettingsType 
} from '@/services/businessSettings';
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
  children: ReactNode;
}

export const BusinessSettingsProvider: React.FC<BusinessSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<BusinessSettingsType | null>(getLocalBusinessSettings());
  const [loading, setLoading] = useState(!settings);
  const { isOnline } = useNetwork();
  const initialized = useRef(false);

  const loadSettings = async (showToast = false) => {
    try {
      setLoading(true);
      // Only force refresh when explicitly requested via the UI
      const businessSettings = await getBusinessSettings(showToast);
      setSettings(businessSettings);
      if (showToast) toast.success('Business settings updated');
    } catch (error) {
      console.error('Failed to load business settings:', error);
      if (showToast) toast.error('Failed to update business settings');
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
  // Refresh settings when coming back online, but avoid unnecessary refreshes
  useEffect(() => {
    // Only refresh when coming back online from offline state
    if (isOnline && initialized.current === true) {
      // Don't block UI, refresh in background
      loadSettings().catch(err => {
        console.error('Background settings refresh failed:', err);
      });
    }
    initialized.current = true;
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