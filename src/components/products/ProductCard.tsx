// src/components/products/ProductCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ProductData, PRODUCT_PLACEHOLDER_SVG } from '@/utils/productUtils';

interface ProductCardProps {
  product: ProductData;
  onClick?: (product: ProductData) => void;
  compact?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, compact = false }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  return (
    <Card 
      className={`${compact ? 'p-2' : 'p-3'} h-full cursor-pointer hover:shadow-md transition-shadow card-hover`}
      onClick={handleClick}
    >
      <CardContent className="p-0 flex flex-col">
        {/* Product Image */}
        <div className="flex justify-center items-center bg-gray-50 rounded mb-3">
          <img 
            src={product.image_url || PRODUCT_PLACEHOLDER_SVG} 
            alt={product.name} 
            className={compact ? "h-10 w-10" : "h-16 w-16"} 
          />
        </div>
        
        {/* Product Name */}
        <h3 className={`${compact ? 'text-sm' : 'text-base'} font-medium truncate`}>{product.name}</h3>
        
        {/* Product Details */}
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
          <p className={`${compact ? 'text-sm' : 'text-base'} font-bold text-sadiid-600`}>
            {product.formatted_price}
          </p>
        </div>
        
        {/* Stock */}
        <p className="text-xs text-gray-500 mt-1">Stock: {product.stock || '0'}</p>
        
        {/* Additional description for non-compact view */}
        {!compact && product.product_description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{product.product_description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;