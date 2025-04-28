import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { getProducts } from '@/services/storage';

interface Product {
  id: number;
  name: string;
  sku: string;
  image_url?: string;
  product_description?: string;
  product_variations?: any[];
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
      {products.map((product) => {
        // Get image
        const imageUrl = product.image_url || '/placeholder.png';

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
        let stock = '';
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
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-32 object-contain mb-2 bg-gray-50 rounded"
                loading="lazy"
              />
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                </div>
                <span className="text-lg font-bold text-sadiid-600">
                  {price ? `\$${Number(price).toFixed(2)}` : 'N/A'}
                </span>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Stock: {stock || 0}
                </span>
              </div>
              {product.product_description && (
                <div className="mt-2 text-xs text-gray-500 line-clamp-2">
                  {product.product_description}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProductList;
