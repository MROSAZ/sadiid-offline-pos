/**
 * Products API Module
 * 
 * Handles all product-related API operations including
 * product CRUD, categories, brands, units, variations, and inventory.
 */

import { apiClient } from '../api-client';
import { 
  ApiResponse, 
  Product, 
  ProductCreateRequest,
  Category,
  Brand,
  Unit,
  Tax,
  ProductVariation,
  StockReport,
  PaginatedResponse
} from '../../types/api';

export class ProductsApi {
  /**
   * Get all products with optional filtering and pagination
   */
  static async getProducts(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category_id?: number;
    brand_id?: number;
    location_id?: number;
    not_for_selling?: boolean;
    order_by?: string;
    direction?: 'asc' | 'desc';
  }): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return apiClient.get<PaginatedResponse<Product>>('product', params);
  }

  /**
   * Get product by ID
   */
  static async getProduct(id: number): Promise<ApiResponse<Product>> {
    return apiClient.getProduct(id);
  }

  /**
   * Create new product
   */
  static async createProduct(productData: ProductCreateRequest): Promise<ApiResponse<Product>> {
    const formData = new FormData();
    
    // Add basic product fields
    Object.entries(productData).forEach(([key, value]) => {
      if (key === 'image' && value instanceof File) {
        formData.append(key, value);
      } else if (key === 'variations' && Array.isArray(value)) {
        // Handle variations array
        value.forEach((variation, index) => {
          Object.entries(variation).forEach(([varKey, varValue]) => {
            formData.append(`variations[${index}][${varKey}]`, String(varValue));
          });
        });
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    return apiClient.createProduct(formData);
  }

  /**
   * Update existing product
   */
  static async updateProduct(id: number, productData: Partial<ProductCreateRequest>): Promise<ApiResponse<Product>> {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    
    // Add product fields to FormData
    Object.entries(productData).forEach(([key, value]) => {
      if (key === 'image' && value instanceof File) {
        formData.append(key, value);
      } else if (key === 'variations' && Array.isArray(value)) {
        value.forEach((variation, index) => {
          Object.entries(variation).forEach(([varKey, varValue]) => {
            formData.append(`variations[${index}][${varKey}]`, String(varValue));
          });
        });
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    return apiClient.updateProduct(id, formData);
  }

  /**
   * Delete product
   */
  static async deleteProduct(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`product/${id}`);
  }

  /**
   * Get product variations
   */
  static async getProductVariations(productId: number): Promise<ApiResponse<ProductVariation[]>> {
    return apiClient.get<ProductVariation[]>(`variation?product_id=${productId}`);
  }

  /**
   * Get variation by ID
   */
  static async getVariation(id: number): Promise<ApiResponse<ProductVariation>> {
    return apiClient.get<ProductVariation>(`variation/${id}`);
  }

  /**
   * Create product variation
   */
  static async createVariation(variationData: any): Promise<ApiResponse<ProductVariation>> {
    return apiClient.post<ProductVariation>('variation', variationData);
  }

  /**
   * Update product variation
   */
  static async updateVariation(id: number, variationData: any): Promise<ApiResponse<ProductVariation>> {
    return apiClient.put<ProductVariation>(`variation/${id}`, variationData);
  }

  /**
   * Delete product variation
   */
  static async deleteVariation(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`variation/${id}`);
  }

  // Categories

  /**
   * Get all categories
   */
  static async getCategories(params?: {
    category_type?: 'product' | 'expense';
  }): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('taxonomy', params);
  }

  /**
   * Get category by ID
   */
  static async getCategory(id: number): Promise<ApiResponse<Category>> {
    return apiClient.get<Category>(`taxonomy/${id}`);
  }

  /**
   * Create new category
   */
  static async createCategory(categoryData: {
    name: string;
    description?: string;
    category_type: 'product' | 'expense';
    parent_id?: number;
  }): Promise<ApiResponse<Category>> {
    return apiClient.post<Category>('taxonomy', categoryData);
  }

  /**
   * Update category
   */
  static async updateCategory(id: number, categoryData: Partial<{
    name: string;
    description?: string;
    parent_id?: number;
  }>): Promise<ApiResponse<Category>> {
    return apiClient.put<Category>(`taxonomy/${id}`, categoryData);
  }

  /**
   * Delete category
   */
  static async deleteCategory(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`taxonomy/${id}`);
  }

  // Brands

  /**
   * Get all brands
   */
  static async getBrands(): Promise<ApiResponse<Brand[]>> {
    return apiClient.get<Brand[]>('brand');
  }

  /**
   * Get brand by ID
   */
  static async getBrand(id: number): Promise<ApiResponse<Brand>> {
    return apiClient.get<Brand>(`brand/${id}`);
  }

  /**
   * Create new brand
   */
  static async createBrand(brandData: {
    name: string;
    description?: string;
  }): Promise<ApiResponse<Brand>> {
    return apiClient.post<Brand>('brand', brandData);
  }

  /**
   * Update brand
   */
  static async updateBrand(id: number, brandData: Partial<{
    name: string;
    description?: string;
  }>): Promise<ApiResponse<Brand>> {
    return apiClient.put<Brand>(`brand/${id}`, brandData);
  }

  /**
   * Delete brand
   */
  static async deleteBrand(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`brand/${id}`);
  }

  // Units

  /**
   * Get all units
   */
  static async getUnits(): Promise<ApiResponse<Unit[]>> {
    return apiClient.get<Unit[]>('unit');
  }

  /**
   * Get unit by ID
   */
  static async getUnit(id: number): Promise<ApiResponse<Unit>> {
    return apiClient.get<Unit>(`unit/${id}`);
  }

  /**
   * Create new unit
   */
  static async createUnit(unitData: {
    actual_name: string;
    short_name: string;
    allow_decimal: boolean;
  }): Promise<ApiResponse<Unit>> {
    return apiClient.post<Unit>('unit', unitData);
  }

  /**
   * Update unit
   */
  static async updateUnit(id: number, unitData: Partial<{
    actual_name: string;
    short_name: string;
    allow_decimal: boolean;
  }>): Promise<ApiResponse<Unit>> {
    return apiClient.put<Unit>(`unit/${id}`, unitData);
  }

  /**
   * Delete unit
   */
  static async deleteUnit(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`unit/${id}`);
  }

  // Taxes

  /**
   * Get all taxes
   */
  static async getTaxes(): Promise<ApiResponse<Tax[]>> {
    return apiClient.get<Tax[]>('tax');
  }

  /**
   * Get tax by ID
   */
  static async getTax(id: number): Promise<ApiResponse<Tax>> {
    return apiClient.get<Tax>(`tax/${id}`);
  }

  /**
   * Create new tax
   */
  static async createTax(taxData: {
    name: string;
    amount: number;
    is_tax_group?: boolean;
  }): Promise<ApiResponse<Tax>> {
    return apiClient.post<Tax>('tax', taxData);
  }

  /**
   * Update tax
   */
  static async updateTax(id: number, taxData: Partial<{
    name: string;
    amount: number;
    is_tax_group?: boolean;
  }>): Promise<ApiResponse<Tax>> {
    return apiClient.put<Tax>(`tax/${id}`, taxData);
  }

  /**
   * Delete tax
   */
  static async deleteTax(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`tax/${id}`);
  }

  // Inventory & Stock

  /**
   * Get product stock report
   */
  static async getStockReport(params?: {
    location_id?: number;
    category_id?: number;
    brand_id?: number;
    unit_id?: number;
  }): Promise<ApiResponse<StockReport[]>> {
    return apiClient.get<StockReport[]>('product-stock-report', params);
  }

  /**
   * Search products for POS
   */
  static async searchProducts(query: string, params?: {
    location_id?: number;
    category_id?: number;
    limit?: number;
  }): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>('product', { 
      search: query,
      not_for_selling: false,
      ...params 
    });
  }
}

export default ProductsApi;
