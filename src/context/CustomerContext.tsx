
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getContacts, saveContacts } from '@/services/storage';
import { fetchContacts } from '@/services/api';
import { useNetwork } from '@/context/NetworkContext';
import { toast } from 'sonner';

export interface Customer {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  contact_id?: string;
  type?: string;
  customer_group_id?: number;
  contact_status?: string;
  tax_number?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  [key: string]: any;
}

interface CustomerContextType {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  refreshCustomers: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline, retryOperation } = useNetwork();

  // Load customers from storage on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Load customers from IndexedDB
  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const storedCustomers = await getContacts();
      if (storedCustomers && storedCustomers.length > 0) {
        setCustomers(storedCustomers);
      } else if (isOnline) {
        // If no stored customers and online, fetch from API
        await refreshCustomers();
      }
    } catch (err) {
      console.error('Error loading customers:', err);
      setError(err instanceof Error ? err : new Error('Failed to load customers'));
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh customers from API
  const refreshCustomers = useCallback(async () => {
    if (!isOnline) {
      toast.error('Cannot refresh customers while offline');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Use retry operation for network resilience
      const response = await retryOperation(async () => {
        return await fetchContacts(1, 500, 'customer');
      });
      
      if (response?.data) {
        // Store contacts in IndexedDB
        await saveContacts(response.data);
        setCustomers(response.data);
        toast.success('Customers refreshed successfully');
      }
    } catch (err) {
      console.error('Error refreshing customers:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh customers'));
      toast.error('Failed to refresh customers');
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, retryOperation]);

  return (
    <CustomerContext.Provider value={{ 
      selectedCustomer, 
      setSelectedCustomer, 
      customers, 
      setCustomers,
      refreshCustomers,
      isLoading,
      error
    }}>
      {children}
    </CustomerContext.Provider>
  );
};
