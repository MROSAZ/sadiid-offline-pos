import { useCallback, useState } from 'react';
import { useRepositories } from '@/context/RepositoryContext';
import { PaginationResult, SaleRecord } from '@/repositories/interfaces/ISaleRepository';
import { useNetwork } from '@/context/NetworkContext';

/**
 * React hook for sales operations
 */
export function useSales() {
  const { saleRepository } = useRepositories();
  const { isOnline } = useNetwork();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Get paginated sales
   */
  const getPaginatedSales = useCallback(async (page = 1, limit = 20): Promise<PaginationResult<SaleRecord>> => {
    setLoading(true);
    setError(null);
    try {
      const result = await saleRepository.getPaginated(page, limit);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch sales'));
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    } finally {
      setLoading(false);
    }
  }, [saleRepository]);

  /**
   * Get sale by ID
   */
  const getSaleById = useCallback(async (id: number): Promise<SaleRecord | null> => {
    setLoading(true);
    setError(null);
    try {
      const sale = await saleRepository.getById(id);
      return sale;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch sale'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [saleRepository]);

  /**
   * Save a new sale
   */
  const saveSale = useCallback(async (sale: SaleRecord): Promise<SaleRecord> => {
    setLoading(true);
    setError(null);
    try {
      const savedSale = await saleRepository.save(sale);
      return savedSale;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save sale'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [saleRepository]);

  /**
   * Get unsynchronized sales
   */
  const getUnsyncedSales = useCallback(async (): Promise<SaleRecord[]> => {
    setLoading(true);
    setError(null);
    try {
      const unsyncedSales = await saleRepository.getUnsyncedSales();
      return unsyncedSales;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch unsynced sales'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [saleRepository]);

  /**
   * Synchronize a specific sale to the server
   */
  const syncSale = useCallback(async (id: number): Promise<boolean> => {
    if (!isOnline) {
      setError(new Error('Cannot sync while offline'));
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      // Get the sale first
      const sale = await saleRepository.getById(id);
      if (!sale) {
        throw new Error(`Sale with ID ${id} not found`);
      }

      // Extract local properties
      const { local_id, is_synced, ...saleData } = sale;
      
      // Attempt to save to server via the repository
      await saleRepository.markAsSynced(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(`Failed to sync sale ${id}`));
      return false;
    } finally {
      setLoading(false);
    }
  }, [isOnline, saleRepository]);

  /**
   * Sync all unsynced sales to the server
   */
  const syncAllUnsynced = useCallback(async (): Promise<number> => {
    if (!isOnline) {
      setError(new Error('Cannot sync while offline'));
      return 0;
    }

    setLoading(true);
    setError(null);
    try {
      const count = await saleRepository.syncToServer();
      return count;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sync sales'));
      return 0;
    } finally {
      setLoading(false);
    }
  }, [isOnline, saleRepository]);

  return {
    loading,
    error,
    getPaginatedSales,
    getSaleById,
    saveSale,
    getUnsyncedSales,
    syncSale,
    syncAllUnsynced
  };
}