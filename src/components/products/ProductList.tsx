// src/components/products/ProductList.tsx
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Package } from 'lucide-react';
import { loadProducts, ProductData } from '@/utils/productUtils';
import ProductCard from '@/components/products/ProductCard';

interface ProductListProps {
  searchTerm?: string;
  categoryId?: number | null;
  onProductClick?: (product: ProductData) => void;
}

const ProductList: React.FC<ProductListProps> = ({ 
  searchTerm = '',
  categoryId = null,
  onProductClick 
}) => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { products: loadedProducts } = await loadProducts(searchTerm, categoryId);
        setProducts(loadedProducts);
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [searchTerm, categoryId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sadiid-600"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Package size={48} />
        <p className="mt-2">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard 
          key={product.id}
          product={product}
          onClick={onProductClick || (() => {})}
          compact={false} // Use expanded view for ProductList
        />
      ))}
    </div>
  );
};

export default ProductList;
