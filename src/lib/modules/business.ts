/**
 * Business API Module
 * 
 * Handles all business-related API operations including
 * business details, locations, settings, and system configuration.
 */

import { apiClient } from '../api-client';
import { 
  ApiResponse, 
  Business, 
  BusinessLocation,
  ProfitLossReport,
  Subscription,
  Package,
  Notification,
  User
} from '../../types/api';

export class BusinessApi {
  /**
   * Get business details
   */
  static async getBusinessDetails(): Promise<ApiResponse<Business>> {
    return apiClient.getBusinessDetails();
  }

  /**
   * Update business details
   */
  static async updateBusinessDetails(businessData: Partial<Business>): Promise<ApiResponse<Business>> {
    return apiClient.put<Business>('business-details', businessData);
  }

  // Business Locations

  /**
   * Get all business locations
   */
  static async getBusinessLocations(): Promise<ApiResponse<BusinessLocation[]>> {
    return apiClient.getBusinessLocations();
  }

  /**
   * Get business location by ID
   */
  static async getBusinessLocation(id: number): Promise<ApiResponse<BusinessLocation>> {
    return apiClient.get<BusinessLocation>(`business-location/${id}`);
  }

  /**
   * Create new business location
   */
  static async createBusinessLocation(locationData: {
    name: string;
    landmark?: string;
    city: string;
    state: string;
    country: string;
    zip_code?: string;
    mobile?: string;
    alternate_number?: string;
    email?: string;
    website?: string;
    invoice_scheme_id?: number;
    invoice_layout_id?: number;
    selling_price_group_id?: number;
    print_receipt_on_invoice?: boolean;
    receipt_printer_type?: 'browser' | 'printer';
    featured_products?: string[];
    payment_methods?: Array<{
      name: string;
      account_id?: string;
    }>;
    custom_field1?: string;
    custom_field2?: string;
    custom_field3?: string;
    custom_field4?: string;
  }): Promise<ApiResponse<BusinessLocation>> {
    return apiClient.post<BusinessLocation>('business-location', locationData);
  }

  /**
   * Update business location
   */
  static async updateBusinessLocation(id: number, locationData: Partial<{
    name: string;
    landmark?: string;
    city: string;
    state: string;
    country: string;
    zip_code?: string;
    mobile?: string;
    alternate_number?: string;
    email?: string;
    website?: string;
    invoice_scheme_id?: number;
    invoice_layout_id?: number;
    selling_price_group_id?: number;
    print_receipt_on_invoice?: boolean;
    receipt_printer_type?: 'browser' | 'printer';
    featured_products?: string[];
    payment_methods?: Array<{
      name: string;
      account_id?: string;
    }>;
    is_active?: boolean;
    custom_field1?: string;
    custom_field2?: string;
    custom_field3?: string;
    custom_field4?: string;
  }>): Promise<ApiResponse<BusinessLocation>> {
    return apiClient.put<BusinessLocation>(`business-location/${id}`, locationData);
  }

  /**
   * Delete business location
   */
  static async deleteBusinessLocation(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`business-location/${id}`);
  }

  // Users & Staff Management

  /**
   * Get all users
   */
  static async getUsers(): Promise<ApiResponse<User[]>> {
    return apiClient.getUsers();
  }

  /**
   * Get user by ID
   */
  static async getUser(id: number): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`user/${id}`);
  }

  /**
   * Create new user
   */
  static async createUser(userData: {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    password: string;
    role_id?: number;
    location_ids?: number[];
    permissions?: string[];
    cmmsn_percent?: number;
    max_sales_discount_percent?: number;
    allow_selected_contacts?: boolean;
    selected_contacts?: number[];
  }): Promise<ApiResponse<User>> {
    return apiClient.post<User>('user', userData);
  }

  /**
   * Update user
   */
  static async updateUser(id: number, userData: Partial<{
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    password?: string;
    role_id?: number;
    location_ids?: number[];
    permissions?: string[];
    cmmsn_percent?: number;
    max_sales_discount_percent?: number;
    allow_selected_contacts?: boolean;
    selected_contacts?: number[];
    is_active?: boolean;
  }>): Promise<ApiResponse<User>> {
    return apiClient.put<User>(`user/${id}`, userData);
  }

  /**
   * Delete user
   */
  static async deleteUser(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`user/${id}`);
  }

  // Reporting

  /**
   * Get profit and loss report
   */
  static async getProfitLossReport(params: {
    location_id?: number;
    start_date: string;
    end_date: string;
    user_id?: number;
  }): Promise<ApiResponse<ProfitLossReport>> {
    return apiClient.get<ProfitLossReport>('profit-loss-report', params);
  }

  /**
   * Get sales summary report
   */
  static async getSalesSummary(params: {
    location_id?: number;
    start_date: string;
    end_date: string;
    user_id?: number;
    contact_id?: number;
  }): Promise<ApiResponse<{
    total_sales: number;
    total_amount: number;
    total_discount: number;
    total_tax: number;
    total_expense: number;
    net_profit: number;
    sales_by_location: Record<string, number>;
    sales_by_user: Record<string, number>;
    top_selling_products: Array<{
      product_name: string;
      quantity_sold: number;
      total_amount: number;
    }>;
  }>> {
    return apiClient.get<any>('sales-summary', params);
  }

  // Subscriptions & Packages

  /**
   * Get active subscription
   */
  static async getActiveSubscription(): Promise<ApiResponse<Subscription>> {
    return apiClient.get<Subscription>('active-subscription');
  }

  /**
   * Get available packages
   */
  static async getPackages(): Promise<ApiResponse<Package[]>> {
    return apiClient.get<Package[]>('packages');
  }

  /**
   * Subscribe to package
   */
  static async subscribeToPackage(packageId: number, paymentData?: {
    payment_method: string;
    payment_transaction_id?: string;
  }): Promise<ApiResponse<Subscription>> {
    return apiClient.post<Subscription>('subscribe', {
      package_id: packageId,
      ...paymentData
    });
  }

  // Notifications

  /**
   * Get notifications
   */
  static async getNotifications(params?: {
    page?: number;
    per_page?: number;
    unread_only?: boolean;
  }): Promise<ApiResponse<Notification[]>> {
    return apiClient.get<Notification[]>('notifications', params);
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(id: number): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`notifications/${id}/read`, {});
  }

  /**
   * Mark all notifications as read
   */
  static async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    return apiClient.put<void>('notifications/mark-all-read', {});
  }

  // Location Services

  /**
   * Get location details from coordinates
   */
  static async getLocationFromCoordinates(latitude: number, longitude: number): Promise<ApiResponse<{
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  }>> {
    return apiClient.get<any>('get-location', { latitude, longitude });
  }

  // System Settings

  /**
   * Get selling price groups
   */
  static async getSellingPriceGroups(): Promise<ApiResponse<Array<{
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
  }>>> {
    return apiClient.get<any[]>('selling-price-group');
  }

  /**
   * Get types of service
   */
  static async getTypesOfService(): Promise<ApiResponse<Array<{
    id: number;
    name: string;
    description?: string;
    enable_custom_fields: boolean;
    packing_charge?: number;
    packing_charge_type?: 'fixed' | 'percent';
  }>>> {
    return apiClient.get<any[]>('types-of-service');
  }

  /**
   * Get type of service by ID
   */
  static async getTypeOfService(id: number): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`types-of-service/${id}`);
  }

  /**
   * Create type of service
   */
  static async createTypeOfService(serviceData: {
    name: string;
    description?: string;
    enable_custom_fields?: boolean;
    packing_charge?: number;
    packing_charge_type?: 'fixed' | 'percent';
  }): Promise<ApiResponse<any>> {
    return apiClient.post<any>('types-of-service', serviceData);
  }

  /**
   * Update type of service
   */
  static async updateTypeOfService(id: number, serviceData: Partial<{
    name: string;
    description?: string;
    enable_custom_fields?: boolean;
    packing_charge?: number;
    packing_charge_type?: 'fixed' | 'percent';
  }>): Promise<ApiResponse<any>> {
    return apiClient.put<any>(`types-of-service/${id}`, serviceData);
  }

  /**
   * Delete type of service
   */
  static async deleteTypeOfService(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`types-of-service/${id}`);
  }

  // Tables (for restaurant mode)

  /**
   * Get all tables
   */
  static async getTables(): Promise<ApiResponse<Array<{
    id: number;
    name: string;
    description?: string;
    location_id: number;
    created_at: string;
    updated_at: string;
  }>>> {
    return apiClient.get<any[]>('table');
  }

  /**
   * Get table by ID
   */
  static async getTable(id: number): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`table/${id}`);
  }

  /**
   * Create new table
   */
  static async createTable(tableData: {
    name: string;
    description?: string;
    location_id: number;
  }): Promise<ApiResponse<any>> {
    return apiClient.post<any>('table', tableData);
  }

  /**
   * Update table
   */
  static async updateTable(id: number, tableData: Partial<{
    name: string;
    description?: string;
    location_id: number;
  }>): Promise<ApiResponse<any>> {
    return apiClient.put<any>(`table/${id}`, tableData);
  }

  /**
   * Delete table
   */
  static async deleteTable(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`table/${id}`);
  }

  // Utility Methods

  /**
   * Check business health
   */
  static async checkBusinessHealth(): Promise<{
    api_accessible: boolean;
    subscription_active: boolean;
    locations_configured: boolean;
    users_configured: boolean;
    payment_methods_configured: boolean;
  }> {
    try {
      const [business, locations, users, subscription] = await Promise.allSettled([
        this.getBusinessDetails(),
        this.getBusinessLocations(),
        this.getUsers(),
        this.getActiveSubscription()
      ]);

      return {
        api_accessible: true,
        subscription_active: subscription.status === 'fulfilled' && 
                           subscription.value.data.status === 'approved',
        locations_configured: locations.status === 'fulfilled' && 
                             locations.value.data.length > 0,
        users_configured: users.status === 'fulfilled' && 
                         users.value.data.length > 0,
        payment_methods_configured: business.status === 'fulfilled'
      };
    } catch (error) {
      return {
        api_accessible: false,
        subscription_active: false,
        locations_configured: false,
        users_configured: false,
        payment_methods_configured: false
      };
    }
  }

  /**
   * Get business configuration summary
   */
  static async getBusinessConfigSummary(): Promise<{
    business: Business;
    locations: BusinessLocation[];
    active_location_count: number;
    user_count: number;
    subscription: Subscription;
    package_limits: {
      max_locations: number;
      max_users: number;
      max_products: number;
      max_invoices: number;
    };
  }> {
    const [business, locations, users, subscription] = await Promise.all([
      this.getBusinessDetails(),
      this.getBusinessLocations(),
      this.getUsers(),
      this.getActiveSubscription()
    ]);

    return {
      business: business.data,
      locations: locations.data,
      active_location_count: locations.data.filter(l => l.is_active).length,
      user_count: users.data.length,
      subscription: subscription.data,
      package_limits: {
        max_locations: subscription.data.package_details?.location_count || 1,
        max_users: subscription.data.package_details?.user_count || 1,
        max_products: subscription.data.package_details?.product_count || 100,
        max_invoices: subscription.data.package_details?.invoice_count || 100
      }
    };
  }
}

export default BusinessApi;
