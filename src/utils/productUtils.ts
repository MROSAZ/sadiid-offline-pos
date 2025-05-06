// src/utils/productUtils.ts
import { BusinessSettings } from '@/types/businessTypes';
import { getBusinessSettings, getProducts, getProductsByCategory } from '@/services/storage';
import { formatCurrencySync } from '@/utils/formatting';

// Standard product image placeholder
export const PRODUCT_PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Cpath d='m9 9 6 6'/%3E%3Cpath d='m15 9-6 6'/%3E%3C/svg%3E`;

export interface ProductData {
  id: string;
  name: string;
  image?: string;
  type: string;
  category: {
    id: number;
    name: string;
  };
  sku?: string;
  enable_stock?: number;
  product_variations: ProductVariation[];
  created_at: string;
  // Add other fields as needed
}

export interface ProductVariation {
  id: number;
  name: string;
  variations: Variation[];
}

export interface Variation {
  id: number;
  name: string;
  sell_price_inc_tax: string;
  variation_location_details: VariationLocationDetail[];
}

export interface VariationLocationDetail {
  location_id: number;
  qty_available: string;
}

// Function to extract price from variation
export const getProductPrice = (product: ProductData): number => {
  if (product.product_variations && 
      product.product_variations.length > 0 && 
      product.product_variations[0].variations && 
      product.product_variations[0].variations.length > 0) {
    return parseFloat(product.product_variations[0].variations[0].sell_price_inc_tax);
  }
  return 0;
};

// Function to extract stock quantity from variation
export const getProductStock = (product: ProductData): string => {
  if (product.product_variations && 
      product.product_variations.length > 0 && 
      product.product_variations[0].variations && 
      product.product_variations[0].variations.length > 0 && 
      product.product_variations[0].variations[0].variation_location_details && 
      product.product_variations[0].variations[0].variation_location_details.length > 0) {
    return product.product_variations[0].variations[0].variation_location_details[0].qty_available || '0';
  }
  return '0';
};

// Format price using business settings
export const formatProductPrice = (price: number | string, businessSettings: BusinessSettings | null): string => {
  if (!price || !businessSettings) return 'N/A';
  return formatCurrencySync(price, businessSettings);
};

// Function to load and process products
export const loadProducts = async (
  searchTerm: string = '',
  categoryId: number | null = null
): Promise<{ 
  products: ProductData[], 
  businessSettings: BusinessSettings | null 
}> => {
  try {
    // Load business settings first for price formatting
    const settings = await getBusinessSettings();
    
    // Fetch products from storage
    let rawProducts;
    if (categoryId) {
      rawProducts = await getProductsByCategory(categoryId);
    } else {
      rawProducts = await getProducts();
    }
    
    // Filter by search term if provided
    const filteredProducts = searchTerm ? 
      rawProducts.filter((product: ProductData) => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) : rawProducts;
    
    return {
      products: filteredProducts,
      businessSettings: settings
    };
  } catch (error) {
    console.error('Error loading products:', error);
    return { products: [], businessSettings: null };
  }
};