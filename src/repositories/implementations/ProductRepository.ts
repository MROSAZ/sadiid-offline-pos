import { fetchProducts } from '@/services/api';
import { getProducts, getProductsByCategory, saveProducts } from '@/services/storage';
import { ProductData } from '@/utils/productUtils';
import { IProductRepository } from '../interfaces/IProductRepository';

/**
 * Concrete implementation of the Product Repository
 */
export class ProductRepository implements IProductRepository {
  /**
   * Get all products
   */
  async getAll(forceRefresh = false): Promise<ProductData[]> {
    if (forceRefresh) {
      await this.syncFromServer();
    }
    return await getProducts();
  }

  /**
   * Get a product by ID
   */
  async getById(id: string, forceRefresh = false): Promise<ProductData | null> {
    const products = await this.getAll(forceRefresh);
    return products.find(product => product.id === id) || null;
  }

  /**
   * Save a product
   */
  async save(product: ProductData): Promise<ProductData> {
    await saveProducts([product]);
    return product;
  }

  /**
   * Delete a product (not implemented as deletion is typically soft-delete handled by the server)
   */
  async delete(id: string): Promise<boolean> {
    // Implement if needed - might need to flag as inactive rather than actually delete
    throw new Error('Product deletion not implemented');
  }

  /**
   * Get products by category ID
   */
  async getByCategory(categoryId: number): Promise<ProductData[]> {
    return await getProductsByCategory(categoryId);
  }

  /**
   * Search products by name or SKU
   */
  async search(query: string): Promise<ProductData[]> {
    const products = await this.getAll();
    if (!query) return products;
    
    const normalizedQuery = query.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(normalizedQuery) || 
      (product.sku && product.sku.toLowerCase().includes(normalizedQuery))
    );
  }

  /**
   * Sync products from the server
   */
  async syncFromServer(): Promise<number> {
    try {
      // Assuming page size of 1000 is enough, adjust based on your needs
      const response = await fetchProducts(1, 1000); 
      if (response.data) {
        await saveProducts(response.data);
        return response.data.length;
      }
      return 0;
    } catch (error) {
      console.error('Error syncing products:', error);
      throw error;
    }
  }
}