/**
 * Contacts API Module
 * 
 * Handles all contact/customer-related API operations including
 * contact CRUD, CRM features, follow-ups, leads, and customer payments.
 */

import { apiClient } from '../api-client';
import { 
  ApiResponse, 
  Contact, 
  ContactCreateRequest,
  CRMLead,
  CRMFollowUp,
  PaginatedResponse
} from '../../types/api';

export class ContactsApi {
  /**
   * Get all contacts with optional filtering and pagination
   */
  static async getContacts(params?: {
    type?: 'customer' | 'supplier' | 'both';
    page?: number;
    per_page?: number;
    name?: string;
    biz_name?: string;
    mobile_num?: string;
    contact_id?: string;
    order_by?: 'name' | 'supplier_business_name' | 'created_at';
    direction?: 'asc' | 'desc';
  }): Promise<ApiResponse<PaginatedResponse<Contact>>> {
    return apiClient.get<PaginatedResponse<Contact>>('contactapi', params);
  }

  /**
   * Get contact by ID
   */
  static async getContact(id: number): Promise<ApiResponse<Contact>> {
    return apiClient.getContact(id);
  }

  /**
   * Create new contact
   */
  static async createContact(contactData: ContactCreateRequest): Promise<ApiResponse<Contact>> {
    return apiClient.createContact(contactData);
  }

  /**
   * Update existing contact
   */
  static async updateContact(id: number, contactData: Partial<ContactCreateRequest>): Promise<ApiResponse<Contact>> {
    return apiClient.updateContact(id, contactData);
  }

  /**
   * Delete contact
   */
  static async deleteContact(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`contactapi/${id}`);
  }

  /**
   * Search contacts by name, business name, or mobile
   */
  static async searchContacts(query: string, type?: 'customer' | 'supplier' | 'both'): Promise<ApiResponse<Contact[]>> {
    return apiClient.get<Contact[]>('contactapi', {
      name: query,
      type: type || 'customer',
      per_page: 50
    });
  }

  /**
   * Get customers only
   */
  static async getCustomers(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<Contact>>> {
    return this.getContacts({
      type: 'customer',
      name: params?.search,
      ...params
    });
  }

  /**
   * Get suppliers only
   */
  static async getSuppliers(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<Contact>>> {
    return this.getContacts({
      type: 'supplier',
      biz_name: params?.search,
      ...params
    });
  }

  // Customer Payments

  /**
   * Record customer payment
   */
  static async recordCustomerPayment(data: {
    contact_id: number;
    amount: number;
    method: string;
    account_id?: number;
    paid_on: string;
    note?: string;
    transaction_no?: string;
    document?: File;
  }): Promise<ApiResponse<any>> {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'document' && value instanceof File) {
        formData.append(key, value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    return apiClient.post<any>('contactapi-payment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Get customer payment history
   */
  static async getCustomerPayments(contactId: number, params?: {
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
  }): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>(`contactapi/${contactId}/payments`, params);
  }

  /**
   * Get customer outstanding balance
   */
  static async getCustomerBalance(contactId: number): Promise<ApiResponse<{
    balance: number;
    credit_limit: number;
    available_credit: number;
    total_due: number;
    total_paid: number;
  }>> {
    return apiClient.get<any>(`contactapi/${contactId}/balance`);
  }

  // CRM Features

  /**
   * Get CRM leads
   */
  static async getLeads(params?: {
    assigned_to?: string;
    name?: string;
    biz_name?: string;
    mobile_num?: number;
    contact_id?: string;
    order_by?: string;
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<ApiResponse<PaginatedResponse<CRMLead>>> {
    return apiClient.get<PaginatedResponse<CRMLead>>('crm/leads', params);
  }

  /**
   * Convert lead to customer
   */
  static async convertLeadToCustomer(leadId: number, customerData?: Partial<ContactCreateRequest>): Promise<ApiResponse<Contact>> {
    return apiClient.post<Contact>(`crm/leads/${leadId}/convert`, customerData);
  }

  // Follow-ups

  /**
   * Get follow-ups
   */
  static async getFollowUps(params?: {
    start_date?: string;
    end_date?: string;
    status?: 'scheduled' | 'completed' | 'cancelled';
    follow_up_type?: string;
    followup_category_id?: string;
    order_by?: 'start_datetime';
    direction?: 'desc' | 'asc';
    per_page?: number;
    page?: number;
  }): Promise<ApiResponse<PaginatedResponse<CRMFollowUp>>> {
    return apiClient.get<PaginatedResponse<CRMFollowUp>>('crm/follow-ups', params);
  }

  /**
   * Get follow-up by ID
   */
  static async getFollowUp(id: number): Promise<ApiResponse<CRMFollowUp>> {
    return apiClient.get<CRMFollowUp>(`crm/follow-ups/${id}`);
  }

  /**
   * Create new follow-up
   */
  static async createFollowUp(followUpData: {
    title: string;
    contact_id: number;
    description?: string;
    schedule_type: string;
    user_id: number[];
    notify_before?: number;
    notify_type?: 'minute' | 'hour' | 'day';
    status?: string;
    notify_via?: {
      sms?: boolean;
      mail?: boolean;
    };
    start_datetime: string;
    end_datetime: string;
    followup_additional_info?: any;
    allow_notification?: boolean;
  }): Promise<ApiResponse<CRMFollowUp>> {
    return apiClient.post<CRMFollowUp>('crm/follow-ups', followUpData);
  }

  /**
   * Update follow-up
   */
  static async updateFollowUp(id: number, followUpData: Partial<{
    title: string;
    contact_id: number;
    description?: string;
    schedule_type: string;
    user_id: number[];
    notify_before?: number;
    notify_type?: 'minute' | 'hour' | 'day';
    status?: string;
    notify_via?: any;
    start_datetime: string;
    end_datetime: string;
    followup_additional_info?: any;
    allow_notification?: boolean;
  }>): Promise<ApiResponse<CRMFollowUp>> {
    return apiClient.put<CRMFollowUp>(`crm/follow-ups/${id}`, followUpData);
  }

  /**
   * Delete follow-up
   */
  static async deleteFollowUp(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`crm/follow-ups/${id}`);
  }

  /**
   * Get follow-up resources (statuses, types, etc.)
   */
  static async getFollowUpResources(): Promise<ApiResponse<{
    statuses: string[];
    follow_up_types: string[];
    categories: any[];
  }>> {
    return apiClient.get<any>('crm/follow-up-resources');
  }

  // Call Logs

  /**
   * Save call logs
   */
  static async saveCallLogs(callLogs: Array<{
    contact_id?: number;
    call_type: 'incoming' | 'outgoing' | 'missed';
    call_duration?: number;
    call_date_time: string;
    mobile_number: string;
    description?: string;
  }>): Promise<ApiResponse<void>> {
    return apiClient.post<void>('crm/call-logs', { call_logs: callLogs });
  }

  // Contact Validation & Utilities

  /**
   * Validate contact data before submission
   */
  static validateContactData(data: ContactCreateRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.first_name?.trim()) {
      errors.push('First name is required');
    }

    if (!data.mobile?.trim()) {
      errors.push('Mobile number is required');
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(data.mobile)) {
      errors.push('Invalid mobile number format');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    if (!data.type || !['customer', 'supplier', 'both'].includes(data.type)) {
      errors.push('Valid contact type is required');
    }

    if (data.type === 'supplier' && !data.supplier_business_name?.trim()) {
      errors.push('Business name is required for suppliers');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format contact name for display
   */
  static formatContactName(contact: Contact): string {
    const parts = [
      contact.prefix,
      contact.first_name,
      contact.middle_name,
      contact.last_name
    ].filter(Boolean);

    return parts.join(' ').trim() || contact.name || 'Unknown Contact';
  }

  /**
   * Format contact address for display
   */
  static formatContactAddress(contact: Contact): string {
    const parts = [
      contact.address_line_1,
      contact.address_line_2,
      contact.city,
      contact.state,
      contact.zip_code,
      contact.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Get contact type display name
   */
  static getContactTypeDisplayName(type: string): string {
    const typeMap: Record<string, string> = {
      'customer': 'Customer',
      'supplier': 'Supplier',
      'both': 'Customer & Supplier'
    };

    return typeMap[type] || type;
  }

  /**
   * Check if contact has outstanding balance
   */
  static hasOutstandingBalance(contact: Contact): boolean {
    return contact.balance !== undefined && contact.balance > 0;
  }

  /**
   * Get contact's primary phone number
   */
  static getPrimaryPhone(contact: Contact): string {
    return contact.mobile || contact.landline || contact.alternate_number || '';
  }
}

export default ContactsApi;
