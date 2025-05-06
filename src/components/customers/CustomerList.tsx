import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useCustomer } from '@/hooks/repository/useCustomer';
import { Customer } from '@/repositories/interfaces/ICustomerRepository';

interface CustomerListProps {
  searchTerm?: string;
}

const CustomerList: React.FC<CustomerListProps> = ({ searchTerm = '' }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { loading, error, getAllCustomers, searchCustomers } = useCustomer();

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        let result: Customer[];
        if (searchTerm) {
          result = await searchCustomers(searchTerm);
        } else {
          result = await getAllCustomers();
        }
        setCustomers(result || []);
      } catch (error) {
        console.error('Error loading customers:', error);
      }
    };
    
    loadCustomers();
  }, [searchTerm, getAllCustomers, searchCustomers]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sadiid-600"></div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <p className="mt-2">No customers found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {customers.map((customer) => (
        <Card key={customer.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg">{customer.name}</h3>
            {customer.email && (
              <p className="text-sm text-gray-500">{customer.email}</p>
            )}
            {customer.mobile && (
              <p className="text-sm text-gray-500">{customer.mobile}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CustomerList;
