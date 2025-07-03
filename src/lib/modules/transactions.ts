/**
 * Transactions API Module
 * 
 * Handles all transaction-related API operations including
 * sales, purchases, returns, payments, and transaction management.
 */

import { apiClient } from '../api-client';
import { 
  ApiResponse, 
  Transaction, 
  TransactionCreateRequest,
  TransactionSellLine,
  PaymentLine,
  PaginatedResponse,
  CashRegister,
  PaymentMethod,
  PaymentAccount
} from '../../types/api';

export class TransactionsApi {
  /**
   * Get all transactions (sales) with optional filtering and pagination
   */
  static async getTransactions(params?: {
    page?: number;
    per_page?: number;
    start_date?: string;
    end_date?: string;
    contact_id?: number;
    location_id?: number;
    payment_status?: 'paid' | 'partial' | 'due';
    status?: 'final' | 'draft' | 'quotation';
    type?: 'sell' | 'sell_return';
    order_by?: string;
    direction?: 'asc' | 'desc';
  }): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    return apiClient.get<PaginatedResponse<Transaction>>('sell', params);
  }

  /**
   * Get transaction by ID
   */
  static async getTransaction(id: number): Promise<ApiResponse<Transaction>> {
    return apiClient.getTransaction(id);
  }

  /**
   * Create new transaction (sale)
   */
  static async createTransaction(transactionData: TransactionCreateRequest): Promise<ApiResponse<Transaction>> {
    return apiClient.createTransaction(transactionData);
  }

  /**
   * Update existing transaction
   */
  static async updateTransaction(id: number, transactionData: Partial<TransactionCreateRequest>): Promise<ApiResponse<Transaction>> {
    return apiClient.updateTransaction(id, transactionData);
  }

  /**
   * Delete transaction
   */
  static async deleteTransaction(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`sell/${id}`);
  }

  /**
   * Create quotation
   */
  static async createQuotation(transactionData: TransactionCreateRequest): Promise<ApiResponse<Transaction>> {
    return apiClient.post<Transaction>('sell', {
      ...transactionData,
      is_quotation: true
    });
  }

  /**
   * Convert quotation to final sale
   */
  static async convertQuotationToSale(id: number, paymentData?: any): Promise<ApiResponse<Transaction>> {
    return apiClient.put<Transaction>(`sell/${id}`, {
      is_quotation: false,
      status: 'final',
      ...paymentData
    });
  }

  /**
   * Suspend sale (draft)
   */
  static async suspendSale(transactionData: TransactionCreateRequest): Promise<ApiResponse<Transaction>> {
    return apiClient.post<Transaction>('sell', {
      ...transactionData,
      is_suspend: true,
      status: 'draft'
    });
  }

  /**
   * Resume suspended sale
   */
  static async resumeSuspendedSale(id: number): Promise<ApiResponse<Transaction>> {
    return apiClient.get<Transaction>(`sell/${id}`);
  }

  // Returns

  /**
   * Get all sell returns
   */
  static async getSellReturns(params?: {
    page?: number;
    per_page?: number;
    start_date?: string;
    end_date?: string;
    contact_id?: number;
    location_id?: number;
  }): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    return apiClient.get<PaginatedResponse<Transaction>>('list-sell-return', params);
  }

  /**
   * Create sell return
   */
  static async createSellReturn(returnData: {
    transaction_id: number;
    return_lines: Array<{
      sell_line_id: number;
      quantity: number;
      unit_price: number;
    }>;
    invoice_no?: string;
    return_date: string;
    additional_notes?: string;
  }): Promise<ApiResponse<Transaction>> {
    return apiClient.post<Transaction>('sell-return', returnData);
  }

  // Cash Register

  /**
   * Get cash registers
   */
  static async getCashRegisters(params?: {
    status?: 'open' | 'close';
    user_id?: number;
    location_id?: number;
    start_date?: string;
    end_date?: string;
    per_page?: number;
  }): Promise<ApiResponse<PaginatedResponse<CashRegister>>> {
    return apiClient.get<PaginatedResponse<CashRegister>>('cash-register', params);
  }

  /**
   * Get cash register by ID
   */
  static async getCashRegister(id: number): Promise<ApiResponse<CashRegister>> {
    return apiClient.get<CashRegister>(`cash-register/${id}`);
  }

  /**
   * Open cash register
   */
  static async openCashRegister(data: {
    location_id: number;
    initial_amount?: number;
    denominations?: any;
    opening_note?: string;
  }): Promise<ApiResponse<CashRegister>> {
    return apiClient.post<CashRegister>('cash-register', data);
  }

  /**
   * Close cash register
   */
  static async closeCashRegister(id: number, data: {
    closing_amount: number;
    total_card_slips?: number;
    total_cheques?: number;
    denominations?: any;
    closing_note?: string;
  }): Promise<ApiResponse<CashRegister>> {
    return apiClient.put<CashRegister>(`cash-register/${id}`, {
      ...data,
      status: 'close',
      closed_at: new Date().toISOString()
    });
  }

  // Payment Methods & Accounts

  /**
   * Get available payment methods
   */
  static async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    return apiClient.get<PaymentMethod[]>('payment-methods');
  }

  /**
   * Get payment accounts
   */
  static async getPaymentAccounts(): Promise<ApiResponse<PaymentAccount[]>> {
    return apiClient.get<PaymentAccount[]>('payment-accounts');
  }

  // Shipping & Delivery

  /**
   * Update shipping status
   */
  static async updateShippingStatus(data: {
    transaction_id: number;
    shipping_status: 'ordered' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
    delivered_to?: string;
    shipping_details?: string;
    shipping_address?: string;
    shipping_charges?: number;
  }): Promise<ApiResponse<Transaction>> {
    return apiClient.post<Transaction>('update-shipping-status', data);
  }

  // Transaction Search & Filters

  /**
   * Search transactions by various criteria
   */
  static async searchTransactions(params: {
    search_term?: string;
    contact_name?: string;
    invoice_no?: string;
    payment_status?: 'paid' | 'partial' | 'due';
    location_id?: number;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<ApiResponse<Transaction[]>> {
    return apiClient.get<Transaction[]>('sell', params);
  }

  /**
   * Get transaction summary for a period
   */
  static async getTransactionSummary(params: {
    start_date: string;
    end_date: string;
    location_id?: number;
    contact_id?: number;
  }): Promise<ApiResponse<{
    total_sales: number;
    total_amount: number;
    total_tax: number;
    total_discount: number;
    payment_breakdown: Record<string, number>;
    top_products: Array<{
      product_name: string;
      quantity_sold: number;
      total_amount: number;
    }>;
  }>> {
    // This would typically be a custom endpoint
    return apiClient.get('transaction-summary', params);
  }

  // Quick Sale helpers

  /**
   * Create quick sale (simplified interface)
   */
  static async createQuickSale(data: {
    location_id: number;
    contact_id: number;
    products: Array<{
      variation_id: number;
      quantity: number;
      unit_price: number;
    }>;
    payment_method: string;
    payment_amount: number;
    discount_amount?: number;
  }): Promise<ApiResponse<Transaction>> {
    const transactionData: TransactionCreateRequest = {
      location_id: data.location_id,
      contact_id: data.contact_id,
      transaction_date: new Date().toISOString().split('T')[0],
      discount_amount: data.discount_amount || 0,
      products: data.products.map(p => ({
        product_id: 0, // Will be determined by variation
        variation_id: p.variation_id,
        quantity: p.quantity,
        unit_price: p.unit_price
      })),
      payments: [{
        method: data.payment_method,
        amount: data.payment_amount,
        paid_on: new Date().toISOString()
      }]
    };

    return apiClient.createTransaction(transactionData);
  }

  /**
   * Validate transaction data before submission
   */
  static validateTransactionData(data: TransactionCreateRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.location_id) {
      errors.push('Location is required');
    }

    if (!data.contact_id) {
      errors.push('Customer is required');
    }

    if (!data.products || data.products.length === 0) {
      errors.push('At least one product is required');
    }

    if (data.products) {
      data.products.forEach((product, index) => {
        if (!product.variation_id) {
          errors.push(`Product ${index + 1}: Variation is required`);
        }
        if (!product.quantity || product.quantity <= 0) {
          errors.push(`Product ${index + 1}: Valid quantity is required`);
        }
        if (!product.unit_price || product.unit_price < 0) {
          errors.push(`Product ${index + 1}: Valid unit price is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default TransactionsApi;
