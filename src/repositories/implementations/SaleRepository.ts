import { createSale } from '@/services/api';
import { getSales, getUnSyncedSales, markSaleAsSynced, saveSale } from '@/services/storage';
import { ISaleRepository, PaginationResult, SaleRecord } from '../interfaces/ISaleRepository';

/**
 * Concrete implementation of the Sale Repository
 */
export class SaleRepository implements ISaleRepository {
  /**
   * Get all sales
   */
  async getAll(): Promise<SaleRecord[]> {
    const result = await this.getPaginated(-1); // Get all records by passing -1 as limit
    return result.data;
  }

  /**
   * Get a sale by ID
   */
  async getById(id: number): Promise<SaleRecord | null> {
    const sales = await this.getAll();
    return sales.find(sale => sale.local_id === id) || null;
  }

  /**
   * Save a sale
   */
  async save(sale: SaleRecord): Promise<SaleRecord> {
    const id = await saveSale(sale);
    return { ...sale, local_id: id };
  }

  /**
   * Delete a sale (not implemented - deletion typically not allowed for POS records)
   */
  async delete(id: number): Promise<boolean> {
    // In most POS systems, sales are never deleted, just voided/cancelled
    throw new Error('Sale deletion not implemented');
  }

  /**
   * Get paginated sales
   */
  async getPaginated(page = 1, limit = 20): Promise<PaginationResult<SaleRecord>> {
    return await getSales(page, limit);
  }

  /**
   * Get unsynchronized sales
   */
  async getUnsyncedSales(): Promise<SaleRecord[]> {
    return await getUnSyncedSales();
  }

  /**
   * Mark a sale as synchronized with the server
   */
  async markAsSynced(id: number): Promise<boolean> {
    return await markSaleAsSynced(id);
  }

  /**
   * Sync unsynced sales to the server
   */
  async syncToServer(): Promise<number> {
    const unSyncedSales = await this.getUnsyncedSales();
    let syncedCount = 0;
    
    for (const sale of unSyncedSales) {
      try {
        // Extract local properties before sending to API
        const { local_id, is_synced, ...saleData } = sale;
        
        // Send to server
        const result = await createSale(saleData);
        
        if (result.success) {
          // Mark as synced locally
          await this.markAsSynced(local_id!);
          syncedCount++;
        }
      } catch (error) {
        console.error(`Error syncing sale ${sale.local_id}:`, error);
        // Continue with other sales even if one fails
      }
    }
    
    return syncedCount;
  }
}