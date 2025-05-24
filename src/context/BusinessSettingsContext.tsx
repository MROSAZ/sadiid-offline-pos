
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  children: React.ReactNode;
}

export const BusinessSettingsProvider: React.FC<BusinessSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<BusinessSettingsType | null>(getLocalBusinessSettings());
  const [loading, setLoading] = useState(!settings);
  const { isOnline } = useNetwork();

  const loadSettings = async (showToast = false) => {
    try {
      setLoading(true);
      const businessSettings = await getBusinessSettings(isOnline);
      setSettings(businessSettings);
      if (showToast) toast.success('Business settings updated');
    } catch (error) {
      console.error('Failed to load business settings:', error);
      if (showToast) toast.error('Failed to update business settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!settings) {
      loadSettings();
    }
  }, []);

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
