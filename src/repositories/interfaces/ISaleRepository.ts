import { SaleData } from '@/services/api';
import { IBaseRepository } from './IBaseRepository';

/**
 * Interface for pagination result from repository
 */
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Interface representing a saved sale with additional properties
 */
export interface SaleRecord extends SaleData {
  local_id?: number;
  is_synced?: number;
}

/**
 * Sales repository interface that extends the base repository
 * and adds sale-specific operations
 */
export interface ISaleRepository extends IBaseRepository<SaleRecord, number> {
  /**
   * Get paginated sales
   * @param page Page number
   * @param limit Items per page
   */
  getPaginated(page?: number, limit?: number): Promise<PaginationResult<SaleRecord>>;
  
  /**
   * Get unsynchronized sales
   */
  getUnsyncedSales(): Promise<SaleRecord[]>;
  
  /**
   * Mark a sale as synchronized with the server
   * @param id Sale identifier
   */
  markAsSynced(id: number): Promise<boolean>;
  
  /**
   * Sync unsynced sales to the server
   * @returns Number of successfully synced sales
   */
  syncToServer(): Promise<number>;
}