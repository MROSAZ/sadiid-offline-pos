import React, { useState, useEffect } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CustomerList from '@/components/customers/CustomerList';
import { useCustomer } from '@/hooks/repository/useCustomer';
import { useNetwork } from '@/context/NetworkContext';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { loading, error, syncCustomers } = useCustomer();
  const { isOnline } = useNetwork();

  // Handle synchronization with the server
  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    
    try {
      const count = await syncCustomers();
      toast.success(`Successfully synced ${count} customers`);
    } catch (err) {
      toast.error('Failed to sync customers');
    }
  };

  // Show error toast if there's an error from the repository
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-sadiid-600" />
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        </div>
        <div className="flex items-center gap-2">
          <Input 
            type="search" 
            placeholder="Search customers..." 
            className="max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleSync} 
            disabled={loading || !isOnline}
            title="Sync customers from server"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      <CustomerList searchTerm={searchTerm} />
    </div>
  );
};

export default Customers;
