import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { loadProducts, ProductData } from '@/utils/productUtils';
import ProductCard from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface POSProductGridProps {
  searchTerm?: string;
  categoryId?: number | null;
  viewMode?: 'grid' | 'table';
}

const POSProductGrid: React.FC<POSProductGridProps> = ({ searchTerm = '', categoryId = null, viewMode = 'grid' }) => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  };  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <ScrollArea className="flex-1">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-1">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-3">
                  <Skeleton className="h-16 w-16 mx-auto rounded" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-10 w-10 rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </div>
    );
  }
  
  if (products.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <Package size={48} />
          <p className="mt-2">No products found</p>
          <p className="text-sm">Try adjusting your search or category filter</p>
        </div>
      </div>
    );
  }  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-1">
            {products.map((product) => (
              <ProductCard 
                key={product.id}
                product={product}
                onClick={() => handleAddToCart(product)}
                compact={true}
              />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow
                  key={product.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleAddToCart(product)}
                >
                  <TableCell>
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      <img 
                        src={product.image_url || '/placeholder.svg'} 
                        alt={product.name} 
                        className="w-6 h-6" 
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{product.name}</div>
                      {product.product_description && (
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {product.product_description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500">{product.sku}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500">{product.stock || '0'}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-blue-600 text-sm">{product.formatted_price}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
};

export default POSProductGrid;
