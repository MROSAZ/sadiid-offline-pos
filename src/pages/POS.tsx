import React, { useEffect, useRef, useState } from 'react';
import { Search, Menu, Table, X, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import POSProductGrid from '@/components/pos/POSProductGrid';
import POSOrderDetails from '../components/pos/POSOrderDetails';
import POSCategoryFilters from '../components/pos/POSCategoryFilters';
import { useCustomer } from '@/context/CustomerContext';

const POS = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  // Customer selection states
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const { selectedCustomer, setSelectedCustomer, customers } = useCustomer();

  // Focus search input when page loads and on key press
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputActive = activeElement instanceof HTMLInputElement || 
                           activeElement instanceof HTMLTextAreaElement;
      
      if (!isInputActive && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    !customerSearchTerm || 
    customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.mobile?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  // Handle customer selection
  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setSearchingCustomer(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchingCustomer && !(event.target as Element).closest('.customer-dropdown')) {
        setSearchingCustomer(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchingCustomer]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-4">
          {/* Products Section (3/4 width on large screens) */}
          <div className="lg:col-span-3 p-4 border-r border-gray-200">
            {/* Search and Menu Bar */}
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" className="text-gray-500">
                <Menu className="h-6 w-6" />
              </Button>
              
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search all products here..."
                  className="flex-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
              
              <Button variant="ghost" size="icon" className="text-gray-500">
                <Table className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Category Filters */}
            <POSCategoryFilters 
              onCategoryChange={setSelectedCategoryId}
              selectedCategoryId={selectedCategoryId}
            />
            
            {/* Products Grid - Pass search term and category ID */}
            <POSProductGrid 
              searchTerm={searchTerm} 
              categoryId={selectedCategoryId}
            />
          </div>
          
          {/* Order Details Section */}
          <div className="lg:col-span-1 p-4 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Order Details</h2>
              <Button variant="ghost" size="icon" className="text-gray-700">
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Customer Selection - Add this new component */}
            <div className="mb-4 customer-dropdown">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Customer</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full flex justify-between items-center text-left h-10 px-3"
                    onClick={() => setSearchingCustomer(!searchingCustomer)}
                  >
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="truncate">
                        {selectedCustomer ? selectedCustomer.name : "Walk-In Customer"}
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  </Button>
                  
                  {searchingCustomer && (
                    <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search customers..."
                          value={customerSearchTerm}
                          onChange={(e) => setCustomerSearchTerm(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        <div 
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                          onClick={() => selectCustomer(null)}
                        >
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          No Customer Selected
                        </div>
                        {filteredCustomers.map(customer => (
                          <div 
                            key={customer.id} 
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectCustomer(customer)}
                          >
                            {customer.name}
                            {customer.mobile && (
                              <span className="text-xs text-gray-500 block">
                                {customer.mobile}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedCustomer && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => selectCustomer(null)}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <POSOrderDetails />
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
