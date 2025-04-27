
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import POSCart from '@/components/pos/POSCart';
import POSProducts from '@/components/pos/POSProducts';

const POS = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-3 mb-6">
        <ShoppingCart className="h-8 w-8 text-sadiid-600" />
        <h1 className="text-2xl font-bold text-gray-800">Point of Sale</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section (2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <POSProducts />
        </div>
        
        {/* Cart Section (1/3 width on large screens) */}
        <div className="lg:col-span-1">
          <POSCart />
        </div>
      </div>
    </div>
  );
};

export default POS;
