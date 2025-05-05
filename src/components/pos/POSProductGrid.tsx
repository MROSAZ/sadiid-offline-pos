import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { loadProducts, ProductData } from '@/utils/productUtils';
import ProductCard from '@/components/products/ProductCard';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import usePagination from '@/hooks/usePagination';

interface POSProductGridProps {
  searchTerm?: string;
  categoryId?: number | null;
}

const POSProductGrid: React.FC<POSProductGridProps> = ({ searchTerm = '', categoryId = null }) => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const itemsPerPage = 20; // Adjust based on your UI needs
  
  const { addItem } = useCart();

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
  
  // Reset pagination when search term or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryId]);
  
  const handleAddToCart = (product: ProductData) => {
    // Add item to cart using processed product data
    addItem({
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price as number,
      quantity: 1,
      discount: 0,
      tax: 0,
      total: product.price as number,
      variation_id: product.variation_id
    });
    
    toast.success(`Added ${product.name} to cart`);
  };

  const { currentPage, totalPages, currentItems, setCurrentPage } = usePagination(products, itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sadiid-600"></div>
      </div>
    );
  }
    
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 product-grid">
        {currentItems.map((product) => (
          <ProductCard 
            key={product.id}
            product={product}
            onClick={handleAddToCart}
            compact={true}
          />
        ))}
        
        {products.length === 0 && (
          <div className="col-span-full flex justify-center items-center h-64 text-gray-500">
            {searchTerm ? 'No products found' : 'No products available'}
          </div>
        )}
      </div>
      
      {/* Pagination Component - Same as before */}
      {products.length > 0 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      {/* Page info */}
      {products.length > 0 && (
        <div className="text-center text-sm text-gray-500 mt-2">
          Showing {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, products.length)} of {products.length} products
        </div>
      )}
    </>
  );
};

export default POSProductGrid;
