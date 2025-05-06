import { IBusinessSettingsRepository } from "../interfaces/IBusinessSettingsRepository";
import { getBusinessSettings, getCategories } from "@/services/storage";
import { BusinessSettings } from "@/types/businessTypes";

/**
 * Implementation of the business settings repository
 */
export class BusinessSettingsRepository implements IBusinessSettingsRepository {
  /**
   * Get business settings
   */
  async getSettings(forceRefresh = false): Promise<BusinessSettings> {
    try {
      return await getBusinessSettings();
    } catch (error) {
      console.error('Error fetching business settings:', error);
      throw error;
    }
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<any[]> {
    try {
      return await getCategories();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
}