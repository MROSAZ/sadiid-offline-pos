// src/components/products/ProductCard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ProductData, 
  PRODUCT_PLACEHOLDER_SVG,
  getProductPrice, 
  getProductStock,
  formatProductPrice 
} from '@/utils/productUtils';
import { getBusinessSettings } from '@/services/storage';

interface ProductCardProps {
  product: ProductData;
  onClick?: (product: ProductData) => void;
  compact?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, compact = false }) => {
  const [businessSettings, setBusinessSettings] = useState(null);
  
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getBusinessSettings();
      setBusinessSettings(settings);
    };
    loadSettings();
  }, []);
  
  // Use optional chaining and nullish coalescing for potentially missing properties
  const imageUrl = product.image || PRODUCT_PLACEHOLDER_SVG;
  const price = getProductPrice(product);
  const formattedPrice = formatProductPrice(price, businessSettings);
  const stock = getProductStock(product);

  return (
    <div className={`${compact ? 'p-2' : 'p-3'} h-full cursor-pointer hover:shadow-md transition-shadow card-hover`} onClick={() => onClick && onClick(product)}>
      <div className="p-0 flex flex-col">
        {/* Product Image */}
        <div className="flex justify-center items-center bg-gray-50 rounded mb-3">
          <img 
            src={imageUrl} 
            alt={product.name} 
            className={compact ? "h-10 w-10" : "h-16 w-16"} 
          />
        </div>
        
        {/* Product Name */}
        <h3 className={`${compact ? 'text-sm' : 'text-base'} font-medium truncate`}>{product.name}</h3>
        
        {/* Product Details */}
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
          <p className={`${compact ? 'text-sm' : 'text-base'} font-bold text-sadiid-600`}>
            {formattedPrice}
          </p>
        </div>
        
        {/* Stock */}
        <p className="text-xs text-gray-500 mt-1">Stock: {stock}</p>
        
        {/* Only show product description if available in the nested structure */}
        {!compact && product.product_variations?.[0]?.variations?.[0]?.name && (
          <p className="text-gray-500 text-sm mt-2 line-clamp-2">
            {product.product_variations[0].variations[0].name}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;