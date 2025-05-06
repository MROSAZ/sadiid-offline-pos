import { BusinessSettings } from "@/types/businessTypes";

/**
 * Interface for business settings repository
 */
export interface IBusinessSettingsRepository {
  /**
   * Get business settings
   */
  getSettings(forceRefresh?: boolean): Promise<BusinessSettings>;

  /**
   * Get product categories
   */
  getCategories(): Promise<any[]>;
}