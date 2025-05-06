import React, { createContext, useContext } from 'react';
import { ProductRepository } from '@/repositories/implementations/ProductRepository';
import { CustomerRepository } from '@/repositories/implementations/CustomerRepository';
import { SaleRepository } from '@/repositories/implementations/SaleRepository';
import { BusinessSettingsRepository } from '@/repositories/implementations/BusinessSettingsRepository';
import { IProductRepository } from '@/repositories/interfaces/IProductRepository';
import { ICustomerRepository } from '@/repositories/interfaces/ICustomerRepository';
import { ISaleRepository } from '@/repositories/interfaces/ISaleRepository';
import { IBusinessSettingsRepository } from '@/repositories/interfaces/IBusinessSettingsRepository';

interface RepositoryContextType {
  productRepository: IProductRepository;
  customerRepository: ICustomerRepository;
  saleRepository: ISaleRepository;
  businessSettingsRepository: IBusinessSettingsRepository;
}

// Create singleton instances of repositories
const productRepository = new ProductRepository();
const customerRepository = new CustomerRepository();
const saleRepository = new SaleRepository();
const businessSettingsRepository = new BusinessSettingsRepository();

// Create context
const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use singleton instances to avoid creating new instances on each render
  const value = {
    productRepository,
    customerRepository,
    saleRepository,
    businessSettingsRepository
  };

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
};

// Custom hook to use the repository context
export const useRepositories = (): RepositoryContextType => {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepositories must be used within a RepositoryProvider');
  }
  return context;
};