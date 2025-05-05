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
  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${compact ? 'h-full' : ''}`}
      onClick={() => onClick && onClick(product)}
    >
      <CardContent className={compact ? "p-3" : "p-4"}>
        {/* Product Image */}
        <div className={`w-full ${compact ? 'h-20' : 'h-32'} flex items-center justify-center bg-gray-50 rounded mb-2`}>
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
          <div className="mt-2 text-xs text-gray-500 line-clamp-2">
            {product.product_description}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;