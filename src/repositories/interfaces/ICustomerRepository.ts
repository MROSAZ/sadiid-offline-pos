import { IBaseRepository } from './IBaseRepository';

/**
 * Interface representing a customer (contact) entity
 */
export interface Customer {
  id: string | number;
  name: string;
  mobile?: string;
  email?: string;
  address?: string;
  balance?: number;
  type: 'customer' | 'supplier' | string;
  // Add other customer properties as needed
}

/**
 * Customer repository interface that extends the base repository
 * and adds customer-specific operations
 */
export interface ICustomerRepository extends IBaseRepository<Customer, string | number> {
  /**
   * Search customers by name or contact details
   * @param query Search query
   */
  search(query: string): Promise<Customer[]>;
  
  /**
   * Get default or walk-in customer
   */
  getDefaultCustomer(): Promise<Customer | null>;
  
  /**
   * Sync customers from the server
   * @returns The number of customers synced
   */
  syncFromServer(): Promise<number>;
}