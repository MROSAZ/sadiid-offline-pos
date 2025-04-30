import React from 'react';
import { Button } from '@/components/ui/button';

// Sample order items to match the design
const orderItems = [
  {
    id: 1,
    name: 'Fellow Clara French Press',
    price: 99.00,
    quantity: 2,
    total: 198.00,
    image: '/placeholder.svg?height=60&width=60'
  },
  {
    id: 2,
    name: 'Fellow Ode Brew Grinder',
    price: 299.00,
    quantity: 1,
    total: 299.00,
    image: '/placeholder.svg?height=60&width=60'
  },
  {
    id: 3,
    name: 'Fellow Stagg EKG Kettle Black',
    price: 165.00,
    quantity: 1,
    total: 165.00,
    image: '/placeholder.svg?height=60&width=60'
  },
  {
    id: 4,
    name: 'Jennings CJ4000 Digital Scale',
    price: 40.00,
    quantity: 2,
    total: 80.00,
    image: '/placeholder.svg?height=60&width=60'
  }
];

const POSOrderDetails = () => {
  // Calculate order totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const discount = 4.00;
  const tax = 2.00;
  const total = subtotal - discount + tax;

  return (
    <div className="flex flex-col h-full">
      {/* Order Items */}
      <div className="flex-1 overflow-y-auto mb-4">
        {orderItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">{item.name}</h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-500 text-sm">{item.quantity}x</span>
                <span className="text-blue-500 font-bold">${item.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Discount sales</span>
          <span className="font-medium text-red-500">-${discount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total sales tax</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="text-lg font-bold">Total</span>
          <span className="text-lg font-bold text-blue-600">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6">
          Pay Now
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="w-full border-gray-300">
            Other
          </Button>
          <Button variant="outline" className="w-full border-gray-300">
            Hold
          </Button>
        </div>
      </div>
    </div>
  );
};

export default POSOrderDetails;
