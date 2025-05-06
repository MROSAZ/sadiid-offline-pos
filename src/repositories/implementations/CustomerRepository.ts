import { fetchContacts } from '@/services/api';
import { getContacts, saveContacts } from '@/services/storage';
import { Customer, ICustomerRepository } from '../interfaces/ICustomerRepository';

/**
 * Concrete implementation of the Customer Repository
 */
export class CustomerRepository implements ICustomerRepository {
  /**
   * Get all customers
   */
  async getAll(forceRefresh = false): Promise<Customer[]> {
    if (forceRefresh) {
      await this.syncFromServer();
    }
    
    const contacts = await getContacts();
    // Filter to return only customers
    return contacts.filter(contact => contact.type === 'customer') as Customer[];
  }

  /**
   * Get a customer by ID
   */
  async getById(id: string | number, forceRefresh = false): Promise<Customer | null> {
    const customers = await this.getAll(forceRefresh);
    return customers.find(customer => 
      customer.id === id || customer.id === Number(id) || customer.id === String(id)
    ) || null;
  }

  /**
   * Save a customer
   */
  async save(customer: Customer): Promise<Customer> {
    await saveContacts([customer]);
    return customer;
  }

  /**
   * Delete a customer (not implemented - typically handled by server)
   */
  async delete(id: string | number): Promise<boolean> {
    // Implement if needed - might need to flag as inactive rather than actually delete
    throw new Error('Customer deletion not implemented');
  }

  /**
   * Search customers by name or contact details
   */
  async search(query: string): Promise<Customer[]> {
    const customers = await this.getAll();
    if (!query) return customers;
    
    const normalizedQuery = query.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(normalizedQuery) || 
      (customer.mobile && customer.mobile.includes(normalizedQuery)) ||
      (customer.email && customer.email.toLowerCase().includes(normalizedQuery))
    );
  }

  /**
   * Get default or walk-in customer
   * Typically, this is the customer with ID 1 in most POS systems
   */
  async getDefaultCustomer(): Promise<Customer | null> {
    const defaultCustomer = await this.getById(1);
    
    if (defaultCustomer) {
      return defaultCustomer;
    }
    
    // If default customer not found, return a placeholder for walk-in customer
    return {
      id: 1,
      name: 'Walk-in Customer',
      type: 'customer'
    };
  }

  /**
   * Sync customers from the server
   */
  async syncFromServer(): Promise<number> {
    try {
      // Fetch customers with a reasonable page size
      const response = await fetchContacts(1, 500, 'customer');
      if (response.data) {
        await saveContacts(response.data);
        return response.data.length;
      }
      return 0;
    } catch (error) {
      console.error('Error syncing customers:', error);
      throw error;
    }
  }
}