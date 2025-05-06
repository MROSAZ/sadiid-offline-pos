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
        const { products: productData } = await loadProducts(searchTerm, categoryId);
        setProducts(productData);
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [searchTerm, categoryId]);
  
  const {
    currentPage,
    totalPages,
    currentItems,
    handlePageChange,
    nextPage,
    prevPage
  } = usePagination<ProductData>({
    items: products,
    itemsPerPage,
    initialPage: 1
  });

  const handleAddToCart = (product: ProductData) => {
    if (product.price) {
      addItem({
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        quantity: 1,
        discount: 0,
        tax: 0,
        total: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        variation_id: product.variation_id
      });
      toast.success(`Added ${product.name} to cart`);
    } else {
      toast.error(`Cannot add ${product.name} - no price available`);
    }
  };

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
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {currentItems.map((product) => (
          <ProductCard 
            key={product.id}
            product={product}
            onClick={() => handleAddToCart(product)}
            compact={true} // Use compact view for POS
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={prevPage} 
                className={`cursor-pointer ${currentPage === 1 ? 'opacity-50 pointer-events-none' : ''}`}
              />
            </PaginationItem>
            
            {/* Page links */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show first page, last page, current page, and pages around current
              const pageNum = i + 1;
              
              if (
                pageNum === 1 || 
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={currentPage === pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              
              // Show ellipsis if there's a gap
              if (
                (pageNum === 2 && currentPage > 3) ||
                (pageNum === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return (
                  <PaginationItem key={`ellipsis-${pageNum}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              
              return null;
            }).filter(Boolean)}
            
            <PaginationItem>
              <PaginationNext 
                onClick={nextPage} 
                className={`cursor-pointer ${currentPage === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default POSProductGrid;
