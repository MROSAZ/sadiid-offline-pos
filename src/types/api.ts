/**
 * Sadiid ERP API Types
 * Generated from OpenAPI specification
 * 
 * This file contains TypeScript type definitions for all API endpoints
 * in the Sadiid ERP system, organized by functional areas.
 */

// Base API Response Types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  status_code: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  next_page_url?: string;
  prev_page_url?: string;
}

// Authentication Types
export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface UserRegistrationRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  business_id?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordUpdateRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

// User Management Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  business_id: number;
  created_at: string;
  updated_at: string;
  email_verified_at?: string;
  is_active: boolean;
  roles?: Role[];
  permissions?: Permission[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
}

// Business Management Types
export interface Business {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessLocation {
  id: number;
  business_id: number;
  name: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  zip_code?: string;
  invoice_scheme_id?: number;
  invoice_layout_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product Management Types
export interface Product {
  id: number;
  business_id: number;
  name: string;
  type: 'single' | 'variable' | 'modifier' | 'combo';
  unit_id: number;
  category_id?: number;
  sub_category_id?: number;
  brand_id?: number;
  tax_id?: number;
  barcode_type?: string;
  sku?: string;
  alert_quantity?: number;
  description?: string;
  image?: string;
  weight?: number;
  is_inactive: boolean;
  not_for_selling: boolean;
  created_at: string;
  updated_at: string;
  variations?: ProductVariation[];
  unit?: Unit;
  category?: Category;
  brand?: Brand;
  tax?: Tax;
}

export interface ProductVariation {
  id: number;
  product_id: number;
  name: string;
  variation_value_id?: number;
  sub_sku?: string;
  default_purchase_price: number;
  dpp_inc_tax: number;
  profit_percent: number;
  default_sell_price: number;
  sell_price_inc_tax: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCreateRequest {
  name: string;
  type: 'single' | 'variable' | 'modifier' | 'combo';
  unit_id: number;
  category_id?: number;
  sub_category_id?: number;
  brand_id?: number;
  tax_id?: number;
  sku?: string;
  alert_quantity?: number;
  description?: string;
  image?: File;
  weight?: number;
  is_inactive?: boolean;
  not_for_selling?: boolean;
  variations?: ProductVariationCreateRequest[];
}

export interface ProductVariationCreateRequest {
  name: string;
  variation_value_id?: number;
  sub_sku?: string;
  default_purchase_price: number;
  dpp_inc_tax: number;
  profit_percent: number;
  default_sell_price: number;
  sell_price_inc_tax: number;
}

// Category & Classification Types
export interface Category {
  id: number;
  business_id: number;
  name: string;
  description?: string;
  category_type: 'product' | 'expense';
  parent_id?: number;
  created_at: string;
  updated_at: string;
  sub_categories?: Category[];
}

export interface Brand {
  id: number;
  business_id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: number;
  business_id: number;
  actual_name: string;
  short_name: string;
  allow_decimal: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tax {
  id: number;
  business_id: number;
  name: string;
  amount: number;
  is_tax_group: boolean;
  for_tax_group?: boolean;
  created_at: string;
  updated_at: string;
}

// Sales & Transaction Types
export interface Transaction {
  id: number;
  business_id: number;
  location_id: number;
  type: 'sell' | 'purchase' | 'sell_return' | 'purchase_return' | 'sell_transfer' | 'purchase_transfer';
  status: 'received' | 'pending' | 'ordered' | 'draft' | 'final';
  payment_status: 'paid' | 'partial' | 'due';
  ref_no?: string;
  source?: string;
  contact_id: number;
  customer_group_id?: number;
  invoice_no?: string;
  transaction_date: string;
  total_before_tax: number;
  tax_amount: number;
  discount_amount: number;
  discount_type: 'fixed' | 'percentage';
  final_total: number;
  expense_category_id?: number;
  expense_for?: number;
  commission_agent?: number;
  document?: string;
  is_direct_sale: boolean;
  is_quotation: boolean;
  is_suspend: boolean;
  exchange_rate: number;
  total_amount_recovered: number;
  transfer_parent_id?: number;
  return_parent_id?: number;
  opening_stock_product_id?: number;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  location?: BusinessLocation;
  sell_lines?: TransactionSellLine[];
  payment_lines?: PaymentLine[];
}

export interface TransactionSellLine {
  id: number;
  transaction_id: number;
  product_id: number;
  variation_id: number;
  quantity: number;
  quantity_returned: number;
  unit_price_before_discount: number;
  unit_price: number;
  line_discount_type: 'fixed' | 'percentage';
  line_discount_amount: number;
  unit_price_inc_tax: number;
  item_tax: number;
  tax_id?: number;
  discount_id?: number;
  lot_no_line_id?: number;
  sell_line_note?: string;
  res_service_staff_id?: number;
  res_line_order_status?: string;
  woocommerce_line_items_id?: string;
  parent_sell_line_id?: number;
  children_type?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
  variation?: ProductVariation;
}

export interface PaymentLine {
  id: number;
  transaction_id: number;
  business_id: number;
  is_return: boolean;
  amount: number;
  method: string;
  transaction_no?: string;
  card_transaction_number?: string;
  card_number?: string;
  card_type?: string;
  card_holder_name?: string;
  card_month?: string;
  card_year?: string;
  card_security?: string;
  cheque_number?: string;
  bank_account_number?: string;
  paid_on: string;
  created_by: number;
  payment_for?: number;
  parent_id?: number;
  note?: string;
  document?: string;
  payment_ref_no?: string;
  account_id?: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreateRequest {
  location_id: number;
  contact_id: number;
  transaction_date: string;
  invoice_no?: string;
  discount_amount?: number;
  discount_type?: 'fixed' | 'percentage';
  tax_rate_id?: number;
  tax_amount?: number;
  shipping_details?: string;
  shipping_address?: string;
  shipping_status?: string;
  delivered_to?: string;
  shipping_charges?: number;
  additional_notes?: string;
  staff_note?: string;
  is_quotation?: boolean;
  is_suspend?: boolean;
  exchange_rate?: number;
  products: TransactionProductRequest[];
  payments?: PaymentRequest[];
}

export interface TransactionProductRequest {
  product_id: number;
  variation_id: number;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  discount_type?: 'fixed' | 'percentage';
  tax_rate_id?: number;
  sell_line_note?: string;
}

export interface PaymentRequest {
  amount: number;
  method: string;
  account_id?: number;
  card_number?: string;
  card_holder_name?: string;
  card_transaction_number?: string;
  card_type?: string;
  card_month?: string;
  card_year?: string;
  card_security?: string;
  cheque_number?: string;
  bank_account_number?: string;
  transaction_no?: string;
  note?: string;
  paid_on: string;
}

// Contact & Customer Management Types
export interface Contact {
  id: number;
  business_id: number;
  type: 'customer' | 'supplier' | 'both';
  supplier_business_name?: string;
  name: string;
  prefix?: string;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  contact_id?: string;
  contact_status: 'active' | 'inactive';
  tax_number?: string;
  city?: string;
  state?: string;
  country?: string;
  address_line_1?: string;
  address_line_2?: string;
  zip_code?: string;
  dob?: string;
  mobile: string;
  landline?: string;
  alternate_number?: string;
  pay_term_number?: number;
  pay_term_type?: 'days' | 'months';
  credit_limit?: number;
  created_by: number;
  balance?: number;
  total_rp: number;
  total_rp_used: number;
  total_rp_expired: number;
  is_default: boolean;
  shipping_address?: string;
  position?: string;
  customer_group_id?: number;
  custom_field1?: string;
  custom_field2?: string;
  custom_field3?: string;
  custom_field4?: string;
  custom_field5?: string;
  custom_field6?: string;
  custom_field7?: string;
  custom_field8?: string;
  custom_field9?: string;
  custom_field10?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactCreateRequest {
  type: 'customer' | 'supplier' | 'both';
  supplier_business_name?: string;
  prefix?: string;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  contact_id?: string;
  tax_number?: string;
  city?: string;
  state?: string;
  country?: string;
  address_line_1?: string;
  address_line_2?: string;
  zip_code?: string;
  dob?: string;
  mobile: string;
  landline?: string;
  alternate_number?: string;
  pay_term_number?: number;
  pay_term_type?: 'days' | 'months';
  credit_limit?: number;
  shipping_address?: string;
  position?: string;
  customer_group_id?: number;
  custom_field1?: string;
  custom_field2?: string;
  custom_field3?: string;
  custom_field4?: string;
  custom_field5?: string;
  custom_field6?: string;
  custom_field7?: string;
  custom_field8?: string;
  custom_field9?: string;
  custom_field10?: string;
}

// CRM Types
export interface CRMLead {
  id: number;
  business_id: number;
  contact_id?: number;
  name: string;
  email?: string;
  mobile?: string;
  address?: string;
  source_id?: number;
  life_stage_id?: number;
  assigned_to?: number;
  created_by: number;
  is_converted: boolean;
  converted_on?: string;
  converted_by?: number;
  additional_info?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMFollowUp {
  id: number;
  business_id: number;
  contact_id?: number;
  title: string;
  description?: string;
  schedule_datetime: string;
  end_datetime?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notify_via_sms: boolean;
  notify_via_email: boolean;
  notify_before?: number;
  notify_type?: 'minutes' | 'hours' | 'days';
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

// Expense Management Types
export interface Expense {
  id: number;
  business_id: number;
  location_id: number;
  payment_status: 'paid' | 'partial' | 'due';
  expense_category_id: number;
  expense_sub_category_id?: number;
  ref_no?: string;
  transaction_date: string;
  total_before_tax: number;
  tax_amount: number;
  final_total: number;
  expense_for?: number;
  contact_id?: number;
  additional_notes?: string;
  is_refund: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  expense_category?: ExpenseCategory;
  location?: BusinessLocation;
  contact?: Contact;
}

export interface ExpenseCategory {
  id: number;
  business_id: number;
  name: string;
  category_type: 'expense';
  parent_id?: number;
  created_at: string;
  updated_at: string;
  sub_categories?: ExpenseCategory[];
}

// Attendance & Time Tracking Types
export interface Attendance {
  id: number;
  user_id: number;
  business_id: number;
  clock_in_time: string;
  clock_out_time?: string;
  essentials_shift_id?: number;
  ip_address?: string;
  clock_in_note?: string;
  clock_out_note?: string;
  created_at: string;
  updated_at: string;
}

export interface ClockInRequest {
  clock_in_note?: string;
  ip_address?: string;
}

export interface ClockOutRequest {
  clock_out_note?: string;
  ip_address?: string;
}

// Reporting Types
export interface StockReport {
  product_id: number;
  product_name: string;
  sku: string;
  current_stock: number;
  stock_price: number;
  stock_value: number;
  total_sold: number;
  total_transferred: number;
  total_adjusted: number;
  total_purchased: number;
  total_sell_return: number;
  total_purchase_return: number;
}

export interface ProfitLossReport {
  total_purchase_shipping_charge: number;
  total_sell_shipping_charge: number;
  total_purchase: number;
  total_purchase_discount: number;
  total_purchase_return: number;
  total_sell: number;
  total_sell_discount: number;
  total_sell_return: number;
  total_expense: number;
  total_adjustment: number;
  total_recovered: number;
  total_reward: number;
  net_profit: number;
  gross_profit: number;
  total_sell_round_off: number;
  left_side_module_data: any;
  right_side_module_data: any;
}

// System Configuration Types
export interface CashRegister {
  id: number;
  business_id: number;
  location_id: number;
  user_id?: number;
  status: 'close' | 'open';
  closed_at?: string;
  closing_amount?: number;
  total_card_slips: number;
  total_cheques: number;
  denominations?: string;
  closing_note?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentAccount {
  id: number;
  business_id: number;
  name: string;
  account_number: string;
  account_type_id: number;
  note?: string;
  is_closed: boolean;
  is_default: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  value: string;
  label: string;
}

// Field Force Management Types
export interface FieldForceVisit {
  id: number;
  business_id: number;
  contact_id: number;
  assigned_to: number;
  visit_to: string;
  visit_address: string;
  visit_on: string;
  visit_for: string;
  meet_with: string;
  meet_with_mobile: string;
  meet_with_designation: string;
  latitude?: string;
  longitude?: string;
  photos?: string;
  visited_on?: string;
  visited_address?: string;
  status: 'assigned' | 'visited' | 'not_visited';
  reason_to_not_visit?: string;
  visited_latitude?: string;
  visited_longitude?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Notification Types
export interface Notification {
  id: number;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: any;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

// Subscription & Package Types
export interface Subscription {
  id: number;
  business_id: number;
  package_id: number;
  start_date: string;
  trial_end_date?: string;
  end_date: string;
  package_price: number;
  package_details: any;
  created_id: number;
  paid_via?: string;
  payment_transaction_id?: string;
  status: 'approved' | 'waiting' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: number;
  name: string;
  description?: string;
  location_count: number;
  user_count: number;
  product_count: number;
  invoice_count: number;
  interval: 'days' | 'months' | 'years';
  interval_count: number;
  trial_days: number;
  price: number;
  sort_order: number;
  is_active: boolean;
  is_private: boolean;
  is_one_time: boolean;
  enable_custom_link: boolean;
  custom_link?: string;
  created_at: string;
  updated_at: string;
}

// API Endpoint Types
export interface ApiEndpoints {
  // Authentication
  login: (data: LoginRequest) => Promise<ApiResponse<AuthTokenResponse>>;
  register: (data: UserRegistrationRequest) => Promise<ApiResponse<User>>;
  logout: () => Promise<ApiResponse<void>>;
  forgotPassword: (data: PasswordResetRequest) => Promise<ApiResponse<void>>;
  updatePassword: (data: PasswordUpdateRequest) => Promise<ApiResponse<void>>;
  
  // Users
  getUsers: () => Promise<ApiResponse<PaginatedResponse<User>>>;
  getUser: (id: number) => Promise<ApiResponse<User>>;
  createUser: (data: UserRegistrationRequest) => Promise<ApiResponse<User>>;
  updateUser: (id: number, data: Partial<User>) => Promise<ApiResponse<User>>;
  deleteUser: (id: number) => Promise<ApiResponse<void>>;
  
  // Business
  getBusinessDetails: () => Promise<ApiResponse<Business>>;
  getBusinessLocations: () => Promise<ApiResponse<BusinessLocation[]>>;
  getBusinessLocation: (id: number) => Promise<ApiResponse<BusinessLocation>>;
  
  // Products
  getProducts: () => Promise<ApiResponse<PaginatedResponse<Product>>>;
  getProduct: (id: number) => Promise<ApiResponse<Product>>;
  createProduct: (data: ProductCreateRequest) => Promise<ApiResponse<Product>>;
  updateProduct: (id: number, data: Partial<ProductCreateRequest>) => Promise<ApiResponse<Product>>;
  deleteProduct: (id: number) => Promise<ApiResponse<void>>;
  
  // Transactions
  getTransactions: () => Promise<ApiResponse<PaginatedResponse<Transaction>>>;
  getTransaction: (id: number) => Promise<ApiResponse<Transaction>>;
  createTransaction: (data: TransactionCreateRequest) => Promise<ApiResponse<Transaction>>;
  updateTransaction: (id: number, data: Partial<TransactionCreateRequest>) => Promise<ApiResponse<Transaction>>;
  deleteTransaction: (id: number) => Promise<ApiResponse<void>>;
  
  // Contacts
  getContacts: () => Promise<ApiResponse<PaginatedResponse<Contact>>>;
  getContact: (id: number) => Promise<ApiResponse<Contact>>;
  createContact: (data: ContactCreateRequest) => Promise<ApiResponse<Contact>>;
  updateContact: (id: number, data: Partial<ContactCreateRequest>) => Promise<ApiResponse<Contact>>;
  deleteContact: (id: number) => Promise<ApiResponse<void>>;
  
  // Additional endpoints can be added here following the same pattern
}

// Export all types for easy importing
export * from './api';
