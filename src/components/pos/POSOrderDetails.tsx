import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCart } from '@/context/CartContext';
import { saveSale } from '@/lib/storage';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext';
import { Package, X, Plus, Minus, ChevronDown, User, Check, ChevronsUpDown, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { formatCurrencySync } from '@/utils/formatting';
import { useBusinessSettings } from '@/context/BusinessSettingsContext';
import { useCustomer } from '@/context/CustomerContext';
import { getBusinessTimestamp } from '@/utils/dateUtils';
import { queueOperation } from '@/services/syncQueue';
import { cn } from '@/lib/utils';

// For product placeholder
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 20 70 Q 60 20, 100 70' fill='none' stroke='%239e9e9e' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E`;

const POSOrderDetails = () => {  const { cart, getSubtotal, getTotal, updateQuantity, removeItem, clearCart } = useCart();
  const { isOnline } = useNetwork();
  const { selectedCustomer, setSelectedCustomer, customers, isLoading: customersLoading } = useCustomer();
  const { settings } = useBusinessSettings();
  
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // Debug: Log customers when they change
  useEffect(() => {
    console.log('Customers loaded:', customers.length, customers);
    
    // If no customers, add a demo customer for testing
    if (customers.length === 0 && !customersLoading) {
      console.log('No customers found, this might be why selection is not working');
    }
  }, [customers, customersLoading]);
  
  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.mobile && customer.mobile.includes(customerSearch))
  );
  
  // Handle customer selection
  const handleCustomerSelect = (customer: any) => {
    console.log('Selecting customer:', customer);
    setSelectedCustomer(customer);
    setOpen(false);
    setCustomerSearch('');
  };
  
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
    setProcessingProgress(0);
    
    try {
      // Simulate processing steps with progress
      setProcessingProgress(25);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Prepare sale data
      const saleData = {
        location_id: cart.location_id,
        contact_id: selectedCustomer?.id || walkInCustomer?.id,
        transaction_date: getBusinessTimestamp(), // Use business timezone instead of UTC
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
          method: paymentMethod,
        }],
        discount_amount: cart.discount,
        tax_amount: cart.tax,
        sale_note: cart.note || undefined,
      };
      
      setProcessingProgress(50);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Offline-first: Always store locally first, then queue for sync
      await saveSale(saleData);
      setProcessingProgress(75);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await queueOperation('sale', saleData);
      setProcessingProgress(100);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Clear cart and show immediate success
      clearCart();
      toast.success('Sale completed successfully');
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Failed to process sale');
    } finally {
      setProcessing(false);
      setProcessingProgress(0);
    }
  };
  
  // Calculate totals
  const subtotal = getSubtotal();
  const discount = cart.discount;
  const tax = cart.tax;
  const total = getTotal();  return (
    <TooltipProvider>
      <Card className="h-full rounded-none border-0 border-l flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0">        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            Order Details
            {cart.items.length > 0 && (
              <Badge variant="secondary" className="h-5">
                {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                disabled={cart.items.length === 0}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Cart</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to clear all items from the cart? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => clearCart()}>
                  Clear Cart
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardTitle>
          {/* Customer Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Customer</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={customersLoading}
              >
                <span className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="truncate">
                    {customersLoading 
                      ? "Loading customers..." 
                      : selectedCustomer 
                        ? selectedCustomer.name 
                        : "Walk-In Customer"
                    }
                  </span>
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <div className="p-2 border-b">
                <Input
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                <div 
                  className="flex items-center px-2 py-2 hover:bg-accent cursor-pointer text-sm"
                  onClick={() => handleCustomerSelect(null)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCustomer === null ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  Walk-In Customer
                </div>
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center px-2 py-2 hover:bg-accent cursor-pointer text-sm"
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{customer.name}</div>
                      {customer.mobile && (
                        <div className="text-xs text-gray-500 truncate">{customer.mobile}</div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredCustomers.length === 0 && customerSearch && (
                  <div className="px-2 py-4 text-center text-sm text-gray-500">
                    No customers found
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
        {/* Cart Items - Scrollable */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 pb-4">
            {cart.items.length > 0 ? (
              cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 flex justify-center items-center">
                    <img src={PLACEHOLDER_SVG} alt={item.name} className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-sm truncate pr-2">{item.name}</h3>
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)} 
                        className="h-6 w-6 text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <X size={14} />
                      </Button>
                    </div>                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border rounded">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost"
                              size="icon"
                              onClick={() => handleQuantityChange(item.id, -1, item.quantity)}
                              className="h-8 w-8"
                            >
                              <Minus size={12} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Decrease quantity</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="px-3 py-1 text-sm min-w-[2rem] text-center">{item.quantity}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost"
                              size="icon"
                              onClick={() => handleQuantityChange(item.id, 1, item.quantity)}
                              className="h-8 w-8"
                            >
                              <Plus size={12} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Increase quantity</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-blue-500 font-bold text-sm">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <Package size={32} />
                <p className="mt-2 text-sm">No items in cart</p>
                <p className="text-xs">Add products by clicking on them</p>
              </div>
            )}
          </div>
        </ScrollArea>
          {/* Fixed Bottom Section - Always Visible */}
        <div className="p-4 border-t bg-background flex-shrink-0"><Card>
            <CardContent className="p-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>+{formatPrice(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between pt-1 font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">{formatPrice(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
            {/* Payment Method Selection - Always Visible */}
          <div className="space-y-2 mt-3">
            <label className="text-sm font-medium text-gray-700">Payment Method</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Cash
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card
                  </div>
                </SelectItem>
                <SelectItem value="mobile">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Mobile Payment
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
            {/* Processing Progress - Show when processing */}
          {processing && (
            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-sm">
                <span>Processing sale...</span>
                <span>{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
            </div>
          )}
          
          {/* Action Buttons - Always Visible */}          <div className="space-y-2 mt-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="lg" 
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  onClick={handleProcessSale}
                  disabled={processing || cart.items.length === 0}
                >
                  {processing ? 'Processing...' : `Pay ${formatPrice(total)} (${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)})`}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Complete the sale with {paymentMethod} payment</p>
              </TooltipContent>
            </Tooltip>
          </div></div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};

export default POSOrderDetails;
