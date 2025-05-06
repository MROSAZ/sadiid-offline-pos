import { ProductData } from '@/utils/productUtils';
import { IBaseRepository } from './IBaseRepository';

/**
 * Product repository interface that extends the base repository
 * and adds product-specific operations
 */
export interface IProductRepository extends IBaseRepository<ProductData, string> {
  /**
   * Get products by category ID
   * @param categoryId Category identifier
   */
  getByCategory(categoryId: number): Promise<ProductData[]>;
  
  /**
   * Search products by name or SKU
   * @param query Search query
   */
  search(query: string): Promise<ProductData[]>;
  
  /**
   * Sync products from the server
   * @returns The number of products synced
   */
  syncFromServer(): Promise<number>;
}