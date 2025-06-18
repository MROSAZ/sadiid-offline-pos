import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package } from 'lucide-react';
import ViewportContainer from '@/components/layouts/ViewportContainer';
import ProductList from '@/components/products/ProductList';
import POSCategoryFilters from '@/components/pos/POSCategoryFilters';
import { ProductData } from '@/utils/productUtils';
import { toast } from 'sonner';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const handleProductClick = (product: ProductData) => {
    toast.info(`Product selected: ${product.name}`);
  };
  return (
    <ViewportContainer>
      {/* Header Section - Fixed */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-sadiid-600" />
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        </div>
        <Input 
          type="search" 
          placeholder="Search products..." 
          className="max-w-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>      {/* Category Filters - Fixed */}
      <div className="flex-shrink-0 mb-6 w-full min-w-0">
        <POSCategoryFilters 
          onCategoryChange={setSelectedCategoryId}
          selectedCategoryId={selectedCategoryId}
        />
      </div>

      {/* Product List - Scrollable */}
      <div className="flex-1 min-h-0">
        <ProductList 
          searchTerm={searchTerm}
          categoryId={selectedCategoryId}
          onProductClick={handleProductClick}
        />
      </div>
    </ViewportContainer>
  );
};

export default Products;
