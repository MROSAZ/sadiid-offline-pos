import { useCallback, useState } from 'react';
import { useRepositories } from '@/context/RepositoryContext';
import { Customer } from '@/repositories/interfaces/ICustomerRepository';

/**
 * React hook for customer operations
 */
export function useCustomer() {
  const { customerRepository } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Get all customers
   */
  const getAllCustomers = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const customers = await customerRepository.getAll(forceRefresh);
      return customers;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch customers'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [customerRepository]);

  /**
   * Get a customer by ID
   */
  const getCustomerById = useCallback(async (id: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const customer = await customerRepository.getById(id);
      return customer;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch customer'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [customerRepository]);

  /**
   * Search customers
   */
  const searchCustomers = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const customers = await customerRepository.search(query);
      return customers;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search customers'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [customerRepository]);

  /**
   * Get default walk-in customer
   */
  const getDefaultCustomer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const customer = await customerRepository.getDefaultCustomer();
      return customer;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get default customer'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [customerRepository]);

  /**
   * Save a customer
   */
  const saveCustomer = useCallback(async (customer: Customer) => {
    setLoading(true);
    setError(null);
    try {
      const savedCustomer = await customerRepository.save(customer);
      return savedCustomer;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save customer'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerRepository]);

  /**
   * Sync customers from server
   */
  const syncCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const count = await customerRepository.syncFromServer();
      return count;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sync customers'));
      return 0;
    } finally {
      setLoading(false);
    }
  }, [customerRepository]);

  return {
    loading,
    error,
    getAllCustomers,
    getCustomerById,
    searchCustomers,
    getDefaultCustomer,
    saveCustomer,
    syncCustomers
  };
}