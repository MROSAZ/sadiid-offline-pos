import { useCallback, useState } from 'react';
import { useRepositories } from '@/context/RepositoryContext';
import { BusinessSettings } from '@/types/businessTypes';

/**
 * React hook for business settings operations
 */
export function useBusinessSettings() {
  const { businessSettingsRepository } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  /**
   * Get business settings
   */
  const getSettings = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const businessSettings = await businessSettingsRepository.getSettings(forceRefresh);
      setSettings(businessSettings);
      return businessSettings;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch business settings');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [businessSettingsRepository]);

  /**
   * Get business categories
   */
  const getCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const categories = await businessSettingsRepository.getCategories();
      return categories;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch categories');
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [businessSettingsRepository]);

  return {
    settings,
    loading,
    error,
    getSettings,
    getCategories
  };
}