
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { getProducts } from '@/services/storage';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  [key: string]: any;
}

const ProductList = () => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              </div>
              <span className="text-lg font-bold text-sadiid-600">
                ${Number(product.price).toFixed(2)}
              </span>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Stock: {product.stock || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductList;
