import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { saveSale } from '@/lib/storage';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext'; 
import { createSale } from '@/services/api';
import { Package, X, Plus, Minus } from 'lucide-react';
import { formatCurrencySync } from '@/utils/formatting';
import { useBusinessSettings } from '@/context/BusinessSettingsContext';
import { useCustomer } from '@/context/CustomerContext';

// For product placeholder
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 20 70 Q 60 20, 100 70' fill='none' stroke='%239e9e9e' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E`;

const POSOrderDetails = () => {
  const { cart, getSubtotal, getTotal, updateQuantity, removeItem, clearCart } = useCart();
  const { isOnline } = useNetwork();
  const { selectedCustomer, customers } = useCustomer();
  const { settings } = useBusinessSettings();
  const [processing, setProcessing] = useState(false);
  
  // Get Walk-In Customer ID
  const walkInCustomer = customers.find(customer => customer.name === "Walk-In Customer");
  
  // Format price using business settings
  const formatPrice = (price: number): string => {
    if (!settings) {
      return price.toFixed(2);
    }
    return formatCurrencySync(price, settings);
  };
  
  const handleQuantityChange = (id: number, change: number, currentQty: number) => {
    const newQuantity = Math.max(1, currentQty + change);
    updateQuantity(id, newQuantity);
  };
  
  const handleProcessSale = async () => {
    if (cart.items.length === 0) {
      toast.error('Cannot create sale with no items');
      return;
    }
    
    if (!cart.location_id) {
      toast.error('Please select a business location first');
      return;
    }
    
    setProcessing(true);
    
    try {
      // Prepare sale data
      const saleData = {
        location_id: cart.location_id,
        contact_id: selectedCustomer?.id || walkInCustomer?.id || null,
        transaction_date: new Date().toISOString(),
        status: 'final',
        products: cart.items.map(item => ({
          product_id: item.product_id,
          variation_id: item.variation_id || undefined,
          quantity: item.quantity,
          unit_price: item.price,
          tax_amount: item.tax,
          discount_amount: item.discount,
        })),
        payment: [{
          amount: getTotal(),
          method: 'cash',
        }],
        discount_amount: cart.discount,
        tax_amount: cart.tax,
        sale_note: cart.note || undefined,
      };
      
      // Different process flows for online vs offline
      if (isOnline) {
        // Online: Create sale directly through API
        const result = await createSale(saleData);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create sale');
        }
        
        toast.success('Sale completed successfully');
      } else {
        // Offline: Save to IndexedDB
        await saveSale(saleData);
        toast.success('Sale saved for syncing when online');
      }
      
      // Clear cart and show success
      clearCart();
      toast.success('Sale completed successfully');
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Failed to process sale');
    } finally {
      setProcessing(false);
    }
  };
  
  // Calculate totals
  const subtotal = getSubtotal();
  const discount = cart.discount;
  const tax = cart.tax;
  const total = getTotal();

  return (
    <div className="flex flex-col h-full">
      {/* Order Items */}
      <div className="flex-1 overflow-y-auto mb-4">
        {cart.items.length > 0 ? (
          cart.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex justify-center items-center">
                <img src={PLACEHOLDER_SVG} alt={item.name} className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-medium text-sm">{item.name}</h3>
                  <button 
                    onClick={() => removeItem(item.id)} 
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border rounded">
                    <button 
                      onClick={() => handleQuantityChange(item.id, -1, item.quantity)}
                      className="px-2 py-1 hover:bg-gray-100"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-2">{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.id, 1, item.quantity)}
                      className="px-2 py-1 hover:bg-gray-100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-blue-500 font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Package size={36} />
            <p className="mt-2">No items in cart</p>
            <p className="text-sm">Add products by clicking on them</p>
          </div>
        )}
      </div>
      
      {/* Order Summary */}
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex justify-between py-1">
          <span className="text-gray-600">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-600">Discount</span>
          <span>-{formatPrice(discount)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-600">Tax</span>
          <span>+{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="text-lg font-bold">Total</span>
          <span className="text-lg font-bold text-blue-600">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        <Button 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6"
          onClick={handleProcessSale}
          disabled={processing || cart.items.length === 0}
        >
          {processing ? 'Processing...' : 'Pay Now'}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="w-full border-gray-300"
            onClick={() => clearCart()}
            disabled={cart.items.length === 0}
          >
            Clear
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-gray-300"
            disabled={!isOnline}
          >
            Hold
          </Button>
        </div>
      </div>
    </div>
  );
};

export default POSOrderDetails;
