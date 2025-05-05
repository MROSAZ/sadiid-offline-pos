import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { saveSale, markSaleAsSynced, getContacts } from '@/services/storage'; // Corrected import for getContacts
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext'; 
import { createSale } from '@/services/api';
import { Package, X, Plus, Minus } from 'lucide-react';
import { formatCurrencySync } from '@/utils/formatting';
import { getBusinessSettings, getLocalBusinessSettings } from '@/services/businessSettings';
import { useCustomer } from '@/context/CustomerContext'; // Updated to use CustomerContext for customer-related logic

// For currency formatting
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 20 70 Q 60 20, 100 70' fill='none' stroke='%239e9e9e' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E`;

const POSOrderDetails = () => {
  const { cart, getSubtotal, getTotal, updateQuantity, removeItem, clearCart } = useCart();
  const { isOnline } = useNetwork();
  const { selectedCustomer, setSelectedCustomer } = useCustomer(); // Updated to use CustomerContext for customer-related logic
  const [processing, setProcessing] = useState(false);
  const [businessSettings, setBusinessSettings] = useState(null);
  
  useEffect(() => {
    // First attempt to use the synchronous function
    const settings = getLocalBusinessSettings();
    if (settings) {
      setBusinessSettings(settings);
      return;
    }
    
    // Fallback to asynchronous function if needed
    const fetchSettings = async () => {
      try {
        const fetchedSettings = await getBusinessSettings();
        setBusinessSettings(fetchedSettings);
      } catch (error) {
        console.error('Error loading business settings:', error);
      }
    };
    
    fetchSettings();
  }, []);

  const formatPrice = (price) => {
    if (!businessSettings) return `$${price.toFixed(2)}`;
    return formatCurrencySync(price, businessSettings);
  };
  
  const handleQuantityChange = (id: number, delta: number, currentQty: number) => {
    const newQty = Math.max(1, currentQty + delta);
    updateQuantity(id, newQty);
  };
  
  const handleProcessSale = async () => {
    if (!cart.location_id) {
      toast.error('No business location selected. Please select a location in Settings.');
      return;
    }
    
    if (cart.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    // Auto-select first customer if none is selected
    if (!selectedCustomer) {
      try {
        const contacts = await getContacts();
        if (contacts && contacts.length > 0) {
          const firstCustomer = contacts[0];
          setSelectedCustomer(firstCustomer);
          toast.info(`Auto-selected customer: ${firstCustomer.name}`, {
            duration: 3000
          });
        }
      } catch (error) {
        console.error('Error auto-selecting customer:', error);
      }
    }
    
    setProcessing(true);
    
    try {
      // Prepare sale data
      const saleData = {
        location_id: cart.location_id,
        contact_id: selectedCustomer?.id, // Use selectedCustomer from CustomerContext
        products: cart.items.map(item => ({
          product_id: item.product_id,
          variation_id: item.variation_id,
          quantity: item.quantity,
          unit_price: item.price,
          tax_rate_id: null,
          tax_amount: 0,
          discount_amount: 0,
          note: ''
        })),
        discount_amount: cart.discount,
        tax_amount: cart.tax,
        shipping_details: null,
        shipping_address: null,
        shipping_status: null,
        delivered_to: null,
        shipping_charges: 0,
        sale_note: cart.note,
        staff_note: '',
        is_quotation: 0,
        is_suspended: 0,
        transaction_date: new Date().toISOString(),
        status: 'final',
        payment: [
          {
            amount: getTotal(),
            method: 'cash',
            account_id: null,
            note: ''
          }
        ]
      };
      
      // Save locally
      const saleId = await saveSale(saleData);
      
      // Try to sync if online
      if (isOnline) {
        try {
          await createSale(saleData);
          // Mark as synced
          await markSaleAsSynced(saleId);
        } catch (error) {
          console.error('Error syncing sale:', error);
        }
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
                    {formatPrice(item.total)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Package size={48} />
            <p className="mt-2">No items in cart</p>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Discount</span>
          <span className="font-medium text-red-500">-{formatPrice(discount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total sales tax</span>
          <span className="font-medium">{formatPrice(tax)}</span>
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
            {isOnline ? 'Online' : 'Offline'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default POSOrderDetails;
