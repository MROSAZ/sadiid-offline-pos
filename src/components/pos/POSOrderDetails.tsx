import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext'; 
import { Package, X, Plus, Minus } from 'lucide-react';
import { formatCurrencySync } from '@/utils/formatting';
import { useCustomer } from '@/context/CustomerContext';
import { useBusinessSettings, useSales } from '@/hooks/repository';

// For product placeholder
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 20 70 Q 60 20, 100 70' fill='none' stroke='%239e9e9e' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E`;

const POSOrderDetails = () => {
  const { 
    items, location_id, discount, tax, note,
    getSubtotal, getTotal, updateQuantity, removeItem, clearCart 
  } = useCart();
  const { isOnline } = useNetwork();
  const { selectedCustomer } = useCustomer();
  const { settings, loading: settingsLoading, error: settingsError, getSettings } = useBusinessSettings();
  const { saveSale, loading: salesLoading, error: salesError } = useSales();
  const [processing, setProcessing] = useState(false);
  
  // Load business settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await getSettings();
      } catch (error) {
        console.error('Error loading business settings:', error);
      }
    };
    
    loadSettings();
  }, [getSettings]);
  
  useEffect(() => {
    if (settingsError) {
      toast.error(settingsError.message);
    }
  }, [settingsError]);
  
  useEffect(() => {
    if (salesError) {
      toast.error(salesError.message);
    }
  }, [salesError]);
  
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
  
  // Guard for items being undefined
  if (!items || settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Package size={36} />
        <p className="mt-2">Loading cart...</p>
      </div>
    );
  }
  
  const handleProcessSale = async () => {
    if (items.length === 0) {
      toast.error('Cannot create sale with no items');
      return;
    }
    
    if (!location_id) {
      toast.error('Please select a business location first');
      return;
    }
    
    // Verify location still exists
    const businessSettings = await getSettings(true);
    const locationExists = businessSettings?.locations && 
      businessSettings.locations.some(loc => loc.id === location_id);
      
    if (!locationExists) {
      toast.error('Selected business location is no longer valid. Please select another location.');
      return;
    }
    
    setProcessing(true);
    
    try {
      // Prepare sale data
      const saleData = {
        location_id,
        contact_id: selectedCustomer?.id || null,
        transaction_date: new Date().toISOString(),
        status: 'final',
        products: items.map(item => ({
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
        discount_amount: discount,
        tax_amount: tax,
        sale_note: note || undefined,
      };
      
     
        await saveSale(saleData);
        toast.success('Sale saved for syncing when online');
      
      
      // Clear cart and show success
      clearCart();
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Failed to process sale');
    } finally {
      setProcessing(false);
    }
  };
  
  // Calculate totals - now we're safe because we've already checked that items exist
  const subtotal = getSubtotal();
  const total = getTotal();

  return (
    <div className="flex flex-col h-full">
      {/* Order Items */}
      <div className="flex-1 overflow-y-auto mb-4">
        {items.length > 0 ? (
          items.map((item) => (
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
          disabled={processing || items.length === 0 || salesLoading}
        >
          {processing || salesLoading ? 'Processing...' : 'Pay Now'}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="w-full border-gray-300"
            onClick={() => clearCart()}
            disabled={items.length === 0}
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
