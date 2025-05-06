import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package, RefreshCw } from 'lucide-react';
import ProductList from '@/components/products/ProductList';
import { ProductData } from '@/utils/productUtils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useProduct } from '@/hooks/repository/useProduct';
import { useNetwork } from '@/context/NetworkContext';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const { loading, error, syncProducts } = useProduct();
  const { isOnline } = useNetwork();

  const handleProductClick = (product: ProductData) => {
    toast.info(`Product selected: ${product.name}`);
  };

  // Handle synchronization with the server
  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    
    try {
      const count = await syncProducts();
      toast.success(`Successfully synced ${count} products`);
    } catch (err) {
      toast.error('Failed to sync products');
    }
  };

  // Show error toast if there's an error from the repository
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-sadiid-600" />
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        </div>
        <div className="flex items-center gap-2">
          <Input 
            type="search" 
            placeholder="Search products..." 
            className="max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleSync} 
            disabled={loading || !isOnline}
            title="Sync products from server"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <ProductList 
        searchTerm={searchTerm}
        categoryId={selectedCategoryId}
        onProductClick={handleProductClick}
      />
    </div>
  );
};

export default Products;
