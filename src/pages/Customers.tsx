
import React from 'react';
import { Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CustomerList from '@/components/customers/CustomerList';

const Customers = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-sadiid-600" />
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        </div>
        <Input 
          type="search" 
          placeholder="Search customers..." 
          className="max-w-xs"
        />
      </div>
      <CustomerList />
    </div>
  );
};

export default Customers;
