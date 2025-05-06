import { useCallback, useState } from 'react';
import { useRepositories } from '@/context/RepositoryContext';
import { ProductData } from '@/utils/productUtils';

/**
 * React hook for product operations
 */
export function useProduct() {
  const { productRepository } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Get all products
   */
  const getAllProducts = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const products = await productRepository.getAll(forceRefresh);
      return products;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [productRepository]);

  /**
   * Get products by category
   */
  const getProductsByCategory = useCallback(async (categoryId: number) => {
    setLoading(true);
    setError(null);
    try {
      const products = await productRepository.getByCategory(categoryId);
      return products;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products by category'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [productRepository]);

  /**
   * Search products
   */
  const searchProducts = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const products = await productRepository.search(query);
      return products;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search products'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [productRepository]);

  /**
   * Get products by search term and category
   * This combines search and category filtering
   */
  const getFilteredProducts = useCallback(async (searchTerm?: string, categoryId?: number | null) => {
    setLoading(true);
    setError(null);
    try {
      let products: ProductData[];
      
      if (categoryId) {
        products = await productRepository.getByCategory(categoryId);
      } else {
        products = await productRepository.getAll();
      }
      
      if (searchTerm) {
        const normalizedSearchTerm = searchTerm.toLowerCase();
        products = products.filter(product => 
          product.name.toLowerCase().includes(normalizedSearchTerm) || 
          (product.sku && product.sku.toLowerCase().includes(normalizedSearchTerm))
        );
      }
      
      return products;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to filter products'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [productRepository]);

  /**
   * Sync products from server
   */
  const syncProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const count = await productRepository.syncFromServer();
      return count;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sync products'));
      return 0;
    } finally {
      setLoading(false);
    }
  }, [productRepository]);

  return {
    loading,
    error,
    getAllProducts,
    getProductsByCategory,
    searchProducts,
    getFilteredProducts,
    syncProducts
  };
}