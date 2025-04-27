
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getProducts } from '@/services/storage';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  price: number;
  [key: string]: any;
}

const POSProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sadiid-600"></div>
      </div>
    );
  }

  return (
    <div>
      <Input 
        type="search" 
        placeholder="Search products..." 
        className="mb-4"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card 
            key={product.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-4">
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-lg font-bold text-sadiid-600">
                ${Number(product.price).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default POSProducts;
