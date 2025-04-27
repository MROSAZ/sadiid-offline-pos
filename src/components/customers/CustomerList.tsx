
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { getContacts } from '@/services/storage';

interface Customer {
  id: number;
  name: string;
  email?: string;
  mobile?: string;
  [key: string]: any;
}

const CustomerList = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await getContacts();
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sadiid-600"></div>
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
