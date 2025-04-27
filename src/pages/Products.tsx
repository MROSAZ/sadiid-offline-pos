
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package } from 'lucide-react';
import ProductList from '@/components/products/ProductList';

const Products = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-sadiid-600" />
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        </div>
        <Input 
          type="search" 
          placeholder="Search products..." 
          className="max-w-xs"
        />
      </div>
      <ProductList />
    </div>
  );
};

export default Products;
