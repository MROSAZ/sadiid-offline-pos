// src/context/CustomerContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface Customer {
  id: number;
  name: string;
  mobile?: string;
}

interface CustomerContextType {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
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

  return (
    <CustomerContext.Provider value={{ selectedCustomer, setSelectedCustomer, customers, setCustomers }}>
      {children}
    </CustomerContext.Provider>
  );
};