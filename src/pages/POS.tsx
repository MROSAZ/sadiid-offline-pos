import React, { useEffect, useRef, useState } from 'react';
import { Search, Table, X, User } from 'lucide-react';
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
  
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const { selectedCustomer, setSelectedCustomer, customers } = useCustomer();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setSearchingCustomer(false);
    setCustomerSearchTerm('');
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.mobile?.includes(customerSearchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-screen">
          <div className="lg:col-span-2 p-4 bg-white border-r border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 max-w-md">
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
            
            <POSCategoryFilters 
              onCategoryChange={setSelectedCategoryId}
              selectedCategoryId={selectedCategoryId}
            />
            
            <POSProductGrid 
              searchTerm={searchTerm} 
              categoryId={selectedCategoryId}
            />
          </div>
          
          <div className="lg:col-span-1 p-4 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Order Details</h2>
              <Button variant="ghost" size="icon" className="text-gray-700">
                <X className="h-6 w-6" />
              </Button>
            </div>
            
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
                  </Button>
                  
                  {searchingCustomer && (
                    <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border max-h-60 overflow-hidden">
                      <div className="p-2 border-b">
                        <Input
                          type="text"
                          placeholder="Search customers..."
                          value={customerSearchTerm}
                          onChange={(e) => setCustomerSearchTerm(e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <div 
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b"
                          onClick={() => selectCustomer(null)}
                        >
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Walk-In Customer</span>
                          </div>
                        </div>
                        {filteredCustomers.map(customer => (
                          <div 
                            key={customer.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => selectCustomer(customer)}
                          >
                            <div>
                              <span className="font-medium">{customer.name}</span>
                              {customer.mobile && (
                                <span className="text-xs text-gray-500 block">
                                  {customer.mobile}
                                </span>
                              )}
                            </div>
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
