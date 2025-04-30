// not implemented on this version of the app
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const POSCart = () => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Cart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="min-h-[400px] border-2 border-dashed rounded-lg flex items-center justify-center">
            <p className="text-gray-500">No items in cart</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>$0.00</span>
            </div>
          </div>
          
          <Button className="w-full bg-sadiid-600 hover:bg-sadiid-700">
            Complete Sale
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default POSCart;
