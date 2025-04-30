import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { getProducts } from '@/services/storage';
import { getBusinessSettings, BusinessSettings } from '@/services/businessSettings';
import { formatCurrency, formatQuantity, formatCurrencySync } from '@/utils/formatting';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';

// Use a placeholder SVG instead of network requests for images
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Cpath d='m9 9 6 6'/%3E%3Cpath d='m15 9-6 6'/%3E%3C/svg%3E`;

interface Product {
  id: number;
  name: string;
  sku: string;
  image_url?: string;
  product_description?: string;
  product_variations?: any[];
  category?: { id: number; name: string };
  [key: string]: any;
}

interface POSProductGridProps {
  searchTerm?: string;
  categoryId?: number | null;
}

const POSProductGrid = ({ searchTerm = '', categoryId = null }: POSProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Adjust based on your UI needs
  
  const { addItem } = useCart();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load business settings first for formatting
        const settings = await getBusinessSettings();
        setBusinessSettings(settings);
        
        // Then load products
        const data = await getProducts();
        setProducts(data || []);
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Reset pagination when search term or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryId]);
  
  // Use the formatCurrencySync utility instead of inline formatting
  const formatPrice = (price: string | number) => {
    if (!price || !businessSettings) return 'N/A';
    return formatCurrencySync(price, businessSettings);
  };
  
  const handleAddToCart = (product: Product) => {
    // Get price from first variation
    let price = 0;
    let variation_id = undefined;
    
    if (
      product.product_variations &&
      product.product_variations.length > 0 &&
      product.product_variations[0].variations &&
      product.product_variations[0].variations.length > 0
    ) {
      const variation = product.product_variations[0].variations[0];
      price = parseFloat(variation.sell_price_inc_tax);
      variation_id = variation.id;
    }
    
    // Add item to cart
    addItem({
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      price: price,
      quantity: 1,
      discount: 0,
      tax: 0,
      total: price,
      variation_id
    });
    
    toast.success(`Added ${product.name} to cart`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sadiid-600"></div>
      </div>
    );
  }
  
  // Filter products by search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryId || 
      (product.category && product.category.id === categoryId);
    
    return matchesSearch && matchesCategory;
  });
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  // Get current page items
  const currentItems = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of grid
      document.querySelector('.product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // Max number of page links to show
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust to show 3 pages around current
      if (currentPage <= 2) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push('ellipsis1');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('ellipsis2');
      }
      
      // Always show last page if not already added
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
    
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 product-grid">
        {currentItems.map((product) => {
          // Get price from first variation
          let price = '';
          if (
            product.product_variations &&
            product.product_variations.length > 0 &&
            product.product_variations[0].variations &&
            product.product_variations[0].variations.length > 0
          ) {
            price = product.product_variations[0].variations[0].sell_price_inc_tax;
          }
          
          // Get stock from first variation location details
          let stock = '0';
          if (
            product.product_variations &&
            product.product_variations.length > 0 &&
            product.product_variations[0].variations &&
            product.product_variations[0].variations.length > 0 &&
            product.product_variations[0].variations[0].variation_location_details &&
            product.product_variations[0].variations[0].variation_location_details.length > 0
          ) {
            stock = product.product_variations[0].variations[0].variation_location_details[0].qty_available;
          }
          
          return (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleAddToCart(product)}
            >
              <CardContent className="p-3">
                {/* Replace image with SVG placeholder */}
                <div className="w-full h-20 flex items-center justify-center bg-gray-50 rounded mb-2">
                  <img src={PLACEHOLDER_SVG} alt="Product" className="h-10 w-10" />
                </div>
                
                <h3 className="text-sm font-medium truncate">{product.name}</h3>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                  <p className="text-sm font-bold text-sadiid-600">{formatPrice(price)}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">Stock: {stock || '0'}</p>
              </CardContent>
            </Card>
          );
        })}
        
        {filteredProducts.length === 0 && (
          <div className="col-span-full flex justify-center items-center h-64 text-gray-500">
            {searchTerm ? 'No products found' : 'No products available'}
          </div>
        )}
      </div>
      
      {/* Pagination Component */}
      {filteredProducts.length > 0 && (
        <Pagination className="mt-6">
          <PaginationContent>
            {/* Previous button */}
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {/* Page numbers */}
            {getPageNumbers().map((page, index) => (
              <PaginationItem key={`page-${index}`}>
                {page === 'ellipsis1' || page === 'ellipsis2' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => handlePageChange(page as number)}
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            {/* Next button */}
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      {/* Page info */}
      {filteredProducts.length > 0 && (
        <div className="text-center text-sm text-gray-500 mt-2">
          Showing {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
        </div>
      )}
    </>
  );
};

export default POSProductGrid;
