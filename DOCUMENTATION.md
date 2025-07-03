# Sadiid Offline POS - Project Documentation

## Project Structure and Function Reference

This document provides a comprehensive overview of all files in the `src` folder and their functions.

> **📋 Documentation Status**: Last updated on July 1, 2025
> - All files in `src` folder have been verified after OpenAPI migration
> - All functions and their purposes are documented
> - UI component functions are excluded as requested
> - Legacy API code has been removed and replaced with OpenAPI-driven architecture

---

## 🏗️ Architecture Overview

### Modern OpenA## 🔧 Key Features (Updated)

### Offline-First Architecture
- All data operations work offline with automatic sync when online
- OpenAPI-driven, type-safe API calls
- Intelligent pagination that fetches ALL data pages automatically
- Local IndexedDB storage for products, customers, and sales
- Complete data synchronization (not partial)ven Architecture
```
OpenAPI Architecture
├── 📋 OpenAPI Specification (docs/openapi.yaml)
├── 🔄 Auto-generated Types (src/types/api.ts)
├── 🧩 Modular API Clients (src/lib/modules/)
├── 🔒 Type-safe Main Client (src/lib/api-client.ts)
└── 📄 Clean API Service (src/services/api.ts)
```

### Key Changes After OpenAPI Migration
- **Removed**: All legacy axios-based API code
- **Added**: Type-safe OpenAPI-generated client code
- **Improved**: Paginated data synchronization
- **Enhanced**: Offline-first capabilities with complete data sync
- **Optimized**: Formatting utilities (removed duplicates)

---

## 📁 Root Files

### `App.tsx`
- **App**: Main application component that sets up routing, context providers, and initializes IndexedDB
- **setupDB**: Async function to initialize IndexedDB on app startup
- **Routes**: Defines protected and public routes with authentication

### `main.tsx`
Application entry point that renders the App component with React Query and Router providers.

### `index.css`
Global CSS styles and Tailwind CSS imports.

### `vite-env.d.ts`
TypeScript environment definitions for Vite.

---

## 📁 Components

### `components/BusinessDetailsTest.tsx`
Component for testing and displaying business details functionality.

### `components/NetworkStatusIndicator.tsx`
Displays current network connection status and quality indicator.

---

## 📁 Components/Auth

### `components/auth/ProtectedRoute.tsx`
Route wrapper that ensures user authentication before accessing protected pages.

---

## 📁 Components/Customers

### `components/customers/CustomerList.tsx`
- **CustomerList**: Displays a paginated list of customers with search functionality
- **CustomerCard**: Individual customer card component with contact details

---

## 📁 Components/Layouts

### `components/layouts/Header.tsx`
- **Header**: Main navigation header with user menu and sync status
- **UserMenu**: Dropdown menu with user options and logout

### `components/layouts/ProtectedLayout.tsx`
- **ProtectedLayout**: Main layout wrapper for authenticated pages with sidebar and header

### `components/layouts/Sidebar.tsx`
- **Sidebar**: Navigation sidebar with menu items and responsive mobile drawer

---

## 📁 Components/POS

### `components/pos/POSCategoryFilters.tsx`
- **POSCategoryFilters**: Category filter buttons for product filtering in POS
- **CategoryButton**: Individual category filter button

### `components/pos/POSOrderDetails.tsx`
- **POSOrderDetails**: Order summary panel showing cart items, totals, and checkout options
- **OrderItem**: Individual cart item with quantity controls
- **PaymentSection**: Payment method selection and processing

### `components/pos/POSProductGrid.tsx`
- **POSProductGrid**: Grid/table view of products with add to cart functionality
- **ProductGridItem**: Individual product card in grid view
- **ProductTableRow**: Individual product row in table view

---

## 📁 Components/Products

### `components/products/ProductCard.tsx`
- **ProductCard**: Reusable product card component with image, name, price, and stock info

### `components/products/ProductList.tsx`
- **ProductList**: Main product listing component with search, filters, and pagination
- **ProductGrid**: Grid layout for products
- **ProductTable**: Table layout for products

---

## 📁 Components/Settings

### `components/settings/BusinessLocationSelector.tsx`
- **BusinessLocationSelector**: Dropdown selector for choosing business location
- **LocationOption**: Individual location option in dropdown

---

## 📁 Context

### `context/AuthContext.tsx`
- **AuthProvider**: Authentication context provider
- **useAuth**: Hook for accessing authentication state
- **queueBackgroundUserRefresh**: Queues background user data refresh

### `context/BusinessSettingsContext.tsx`
- **BusinessSettingsProvider**: Business settings context provider
- **useBusinessSettings**: Hook for accessing business settings
- **refreshSettings**: Refreshes business settings from API

### `context/CartContext.tsx`
- **CartProvider**: Shopping cart context provider
- **useCart**: Hook for accessing cart state and actions
- **addItem**: Adds item to cart
- **updateQuantity**: Updates item quantity in cart
- **removeItem**: Removes item from cart
- **clearCart**: Clears all items from cart
- **setDiscount**: Sets discount amount
- **setTax**: Sets tax amount
- **setNote**: Sets note for the cart
- **setLocation**: Sets location ID for the cart
- **setCustomer**: Sets customer for the cart
- **setEditingSale**: Sets sale ID being edited
- **getSubtotal**: Calculates cart subtotal
- **getTotal**: Calculates cart total including tax and discount

### `context/CustomerContext.tsx`
- **CustomerProvider**: Customer context provider
- **useCustomer**: Hook for accessing customer state and actions
- **loadCustomers**: Loads customers from IndexedDB
- **refreshCustomers**: Refreshes customers from API
- **setSelectedCustomer**: Sets the selected customer

### `context/NetworkContext.tsx`
- **NetworkProvider**: Network status context provider
- **useNetwork**: Hook for accessing network state
- **checkServerReachable**: Checks if server is reachable
- **retryOperation**: Retries failed operations with exponential backoff
- **setNote**: Sets order note
- **setLocation**: Sets business location
- **setCustomer**: Sets selected customer
- **setEditingSale**: Sets sale being edited
- **getSubtotal**: Calculates cart subtotal
- **getTotal**: Calculates cart total

### `context/CustomerContext.tsx`
- **CustomerProvider**: Customer context provider
- **useCustomer**: Hook for accessing customer state
- **loadCustomers**: Loads customers from storage/API
- **refreshCustomers**: Refreshes customer data
- **setSelectedCustomer**: Sets currently selected customer
- **Customer Interface**: Type definition for customer data structure

### `context/NetworkContext.tsx`
- **NetworkProvider**: Network status context provider
- **useNetwork**: Hook for accessing network state
- **checkServerReachable**: Checks if server is reachable
- **retryOperation**: Retries failed operations with backoff

---

## 📁 Examples

### `examples/offlineFirstPatterns.ts`
Comprehensive example file demonstrating offline-first implementation patterns:
- **wrongSaleCreation**: Example of incorrect conditional online/offline logic
- **wrongDataFetch**: Example of incorrect network-dependent data fetching
- **correctSaleCreation**: Example of proper offline-first sale creation
- **correctDataFetch**: Example of proper local-first data fetching with background sync
- **correctSearchImplementation**: Example of local search with server enhancement
- **correctSyncImplementation**: Example of proper background sync implementation
- **correctCustomerCreation**: Example of proper offline-first customer creation
- **handleFormSubmit**: Example form submission with offline support
- **handleSearch**: Example search with offline fallback
- **handleOnlineTransition**: Example online transition handling
- **handleOfflineTransition**: Example offline transition handling
- **robustOperation**: Example robust operation with retry logic

---

## 📁 Hooks

### `hooks/use-mobile.tsx`
- **useIsMobile**: Custom hook to detect if device is mobile based on screen width

---

## 📁 Hooks

### `hooks/use-mobile.tsx`
- **useIsMobile**: Hook to detect if device is mobile based on screen width

---

## 📁 Lib

### `lib/businessSettings.ts`
- **getBusinessSettings**: Retrieves business settings from API or cache
- **getLocalBusinessSettings**: Gets business settings from local storage
- **saveBusinessSettings**: Saves business settings to local storage
- **CurrencyInfo**: Interface for currency information
- **BusinessLocation**: Interface for business location data
- **BusinessSettings**: Interface for business settings data

### `lib/storage.ts`
- **initDB**: Initializes IndexedDB database
- **getDB**: Gets IndexedDB database instance
- **saveToken**: Saves authentication token
- **getToken**: Retrieves authentication token
- **removeToken**: Removes authentication token
- **saveUser**: Saves user data to IndexedDB
- **getUser**: Retrieves user data from IndexedDB
- **saveProducts**: Saves products to IndexedDB
- **getProducts**: Retrieves products from IndexedDB
- **getCategories**: Gets product categories
- **getProductsByCategory**: Gets products filtered by category
- **saveContacts**: Saves contacts to IndexedDB
- **getContacts**: Retrieves contacts from IndexedDB
- **saveContact**: Saves single contact to IndexedDB
- **saveSale**: Saves sale to IndexedDB
- **getUnSyncedSales**: Gets sales not yet synced to server
- **getSales**: Retrieves sales from IndexedDB
- **getSaleById**: Retrieves specific sale by ID
- **updateSale**: Updates existing sale data
- **updateSaleWithSyncedData**: Updates sale with synced API data
- **markSaleAsSynced**: Marks sale as successfully synced
- **markSaleAsSyncFailed**: Marks sale as sync failed with error
- **saveBusinessSettingsToDB**: Saves business settings to IndexedDB
- **getBusinessSettingsFromDB**: Retrieves business settings from IndexedDB
- **getLocalItem**: Gets item from localStorage
- **setLocalItem**: Sets item in localStorage
- **getLocalItemAsJson**: Gets and parses JSON item from localStorage
- **saveSelectedLocationIdToDB**: Saves selected location ID to IndexedDB
- **getSelectedLocationIdFromDB**: Retrieves selected location ID from IndexedDB

### `lib/utils.ts`
Utility functions for common operations:
- **cn**: Class name utility function for conditional CSS classes
- **parseApiError**: Parse API errors for user-friendly messages

---

## 📁 Pages

### `pages/Customers.tsx`
- **Customers**: Main customer management page with list and search functionality

### `pages/Dashboard.tsx`
- **Dashboard**: Main dashboard page with overview statistics and quick actions

### `pages/Index.tsx`
- **Index**: Landing page component that redirects to appropriate route

### `pages/Login.tsx`
- **Login**: Authentication page with login form and validation

### `pages/NotFound.tsx`
- **NotFound**: 404 error page for undefined routes

### `pages/POS.tsx`
- **POS**: Main point of sale interface with product grid, cart, and checkout

### `pages/Products.tsx`
- **Products**: Product management page with product listing and search

### `pages/Sales.tsx`
- **Sales**: Sales history and management page with pagination
- **handleEditSale**: Loads sale data into cart for editing
- **handlePrintReceipt**: Generates and prints app-based receipt
- **handlePrintBill**: Opens backend invoice URL for printing
- **handleSync**: Manually syncs individual sale
- **formatAmount**: Formats currency amounts based on business settings

### `pages/Settings.tsx`
- **Settings**: Application settings and configuration page

---

## 📁 Services

### `services/api.ts`
Modern OpenAPI-driven API service with comprehensive backend integration:
- **login**: User authentication with OAuth2
- **getCurrentUser**: Get current user data
- **fetchBusinessDetails**: Get business settings and configuration
- **fetchProducts**: Get products with intelligent pagination (fetches all pages)
- **fetchContacts**: Get contacts with intelligent pagination (fetches all pages)
- **createContact**: Create new contact
- **createSale**: Create new sale transaction
- **fetchSales**: Get sales data with pagination
- **SaleProduct**: Interface for sale product data
- **SalePayment**: Interface for sale payment data
- **SaleData**: Interface for complete sale data

**Note**: This service now uses OpenAPI-generated, type-safe modules and handles complete data synchronization.

### `services/locationService.ts`
Business location management service:
- **getLocations**: Get all available business locations
- **getSelectedLocationId**: Get currently selected location ID
- **setSelectedLocationId**: Set selected location ID
- **getSelectedLocation**: Get currently selected location object
- **isValidLocationId**: Validate location ID
- **autoSelectLocation**: Auto-select valid location
- **ensureValidLocation**: Ensure a valid location is selected

### `services/syncQueue.ts`
Queue management system for offline operations:
- **initSyncQueueDB**: Initialize sync queue IndexedDB
- **queueOperation**: Add operation to sync queue
- **getOperationsByStatus**: Get operations by status
- **getOperationsByType**: Get operations by type
- **updateOperationStatus**: Update operation status
- **cleanupCompletedOperations**: Clean up old completed operations
- **getLastSyncTimestamp**: Get last sync timestamp
- **updateLastSyncTimestamp**: Update last sync timestamp
- **isSyncNeeded**: Check if sync is needed
- **deleteOperation**: Delete specific operation
- **getQueueStats**: Get queue statistics
- **processQueue**: Process pending operations
- **processSaleOperation**: Process sale sync operation

### `services/syncService.ts`
Main synchronization service for OpenAPI-driven data sync:
- **syncProducts**: Sync products using paginated API calls (fetches all pages)
- **syncContacts**: Sync contacts using paginated API calls (fetches all pages)
- **syncData**: Main data synchronization function with intelligent pagination
- **syncDataOnLogin**: Sync data when user logs in
- **startBackgroundSync**: Start background sync process
- **stopBackgroundSync**: Stop background sync process

**Note**: Completely rewritten for OpenAPI architecture with robust pagination support.

---

## 📁 Types

### `types/performance.d.ts`
- **PerformanceEventTiming**: Interface for performance event timing data

---

## 📁 Utils

### `utils/apiUtils.ts`
API utility functions:
- **delay**: Promise-based delay function
- **withRetry**: Retry function with exponential backoff

### `utils/backgroundSync.ts`
Background task management utilities:
- **queueBackgroundTask**: Queue background task with unique ID
- **isTaskQueued**: Check if task is currently queued
- **getQueuedTaskCount**: Get count of queued tasks
- **clearQueuedTasks**: Clear all queued tasks
- **performWhenOnline**: Execute function when network is available
- **BackgroundTasks**: Enum of background task types

### `utils/dateUtils.ts`
Date and time utility functions:
- **getBusinessTimestamp**: Get current timestamp in business timezone
- **formatBusinessDate**: Format date according to business settings
- **parseBusinessDate**: Parse date string in business timezone
- **getTimezoneOffset**: Get timezone offset for business location

### `utils/formatting.ts`
Optimized formatting utility functions (cleaned up after OpenAPI migration):
- **formatCurrency**: Async currency formatting with business settings
- **formatCurrencySync**: Synchronous currency formatting (primary method used in app)
- **formatNumberWithPrecision**: Formats numbers with specified precision

**Note**: Removed unused functions (`formatDate`, `formatQuantity`, `formatPhoneNumber`, `truncateText`) that were not being used in the application. Currency formatting is now the primary focus of this utility.

### `utils/productUtils.ts`
Product-related utility functions:
- **PRODUCT_PLACEHOLDER_SVG**: Default product image placeholder
- **extractProductPrice**: Extract price from product variations
- **extractProductStock**: Extract stock from product variations
- **formatProductForCart**: Format product data for cart
- **getProductImage**: Get product image URL with fallback
- **calculateDiscountedPrice**: Calculate discounted price
- **isProductInStock**: Check if product is in stock
- **getProductsBySearchTerm**: Search products by term
- **sortProducts**: Sort products by various criteria

### `pages/Customers.tsx`
- **Customers**: Main customers page with list and search functionality

### `pages/Dashboard.tsx`
- **Dashboard**: Main dashboard with stats, sync status, and quick actions
- **loadStats**: Loads dashboard statistics
- **handleSync**: Manually triggers sync operation

### `pages/Index.tsx`
- **Index**: Landing page that redirects based on authentication status

### `pages/Login.tsx`
- **Login**: Login page with form and authentication handling
- **handleSubmit**: Processes login form submission

### `pages/NotFound.tsx`
- **NotFound**: 404 error page for invalid routes

### `pages/POS.tsx`
- **POS**: Main Point of Sale page with products and cart
- **handleSearch**: Handles product search
- **handleKeyDown**: Handles keyboard shortcuts

### `pages/Products.tsx`
- **Products**: Products management page with listing and search
- **handleProductClick**: Handles product selection

### `pages/Sales.tsx`
- **Sales**: Sales history page with listing, editing, and printing
- **loadSales**: Loads sales data with pagination
- **handleEditSale**: Loads sale for editing in POS
- **handlePrintReceipt**: Generates and prints receipt
- **handlePrintBill**: Opens invoice URL for printing
- **formatAmount**: Formats currency amounts
- **handleSyncSale**: Manually syncs individual sale

### `pages/Settings.tsx`
- **Settings**: Application settings page with tabs for different setting categories

---

## 📁 Services

### `services/api.ts`
- **login**: Authenticates user with OAuth2 credentials
- **getCurrentUser**: Gets current user information
- **fetchProducts**: Fetches products from API with intelligent pagination (all pages)
- **fetchContacts**: Fetches contacts from API with intelligent pagination (all pages)
- **createContact**: Creates new contact via API
- **createSale**: Creates new sale via API
- **fetchBusinessDetails**: Fetches business details from API
- **SaleProduct**: Interface for sale product data
- **SalePayment**: Interface for sale payment data
- **SaleData**: Interface for complete sale data

**Note**: Uses OpenAPI-generated, type-safe API calls with complete data synchronization.

### `services/locationService.ts`
- **getLocations**: Gets business locations with caching
- **getSelectedLocationId**: Gets currently selected location ID
- **setSelectedLocationId**: Sets selected location ID
- **getSelectedLocation**: Gets selected location data
- **isValidLocationId**: Validates location ID
- **autoSelectLocation**: Automatically selects first available location
- **formatLocationAddress**: Formats location address for display

### `services/syncQueue.ts`
- **initSyncQueueDB**: Initializes sync queue IndexedDB
- **queueOperation**: Adds operation to sync queue
- **getOperationsByStatus**: Gets operations by status (pending, failed, etc.)
- **getOperationsByType**: Gets operations by type (sale, customer, etc.)
- **updateOperationStatus**: Updates operation status
- **deleteOperation**: Deletes operation from queue
- **getQueueStats**: Gets queue statistics
- **processQueue**: Processes pending operations
- **processSaleOperation**: Processes sale sync operation
- **processCustomerOperation**: Processes customer sync operation
- **cleanupCompletedOperations**: Cleans up old completed operations
- **getLastSyncTimestamp**: Gets last sync timestamp
- **updateLastSyncTimestamp**: Updates last sync timestamp
- **isSyncNeeded**: Checks if sync is needed

### `services/syncService.ts`
- **syncProducts**: Syncs products using paginated API with complete data fetching
- **syncContacts**: Syncs contacts using paginated API with complete data fetching
- **syncData**: Main sync function for all data types with intelligent pagination
- **syncDataOnLogin**: Syncs data when user logs in
- **startBackgroundSync**: Starts background sync interval
- **stopBackgroundSync**: Stops background sync interval

**Note**: Rewritten for OpenAPI architecture with robust pagination and error handling.

---

## 📁 Utils

### `utils/apiUtils.ts`
- **delay**: Creates delay promise for retry logic
- **withRetry**: Wraps function with retry logic and exponential backoff

### `utils/backgroundSync.ts`
- **queueBackgroundTask**: Queues background task with debouncing
- **isTaskQueued**: Checks if task is already queued
- **getQueuedTaskCount**: Gets count of queued tasks
- **clearQueuedTasks**: Clears all queued tasks
- **BackgroundTasks**: Constants for different background task types

### `utils/dateUtils.ts`
- **getBusinessTimestamp**: Gets current timestamp in business timezone
- **formatBusinessDate**: Formats date in business timezone
- **parseBusinessDate**: Parses date string in business timezone

### `utils/formatting.ts`
- **formatCurrency**: Async currency formatting with business settings
- **formatCurrencySync**: Synchronous currency formatting (primary method)
- **formatNumberWithPrecision**: Formats numbers with specified precision

**Note**: Optimized after OpenAPI migration - removed unused functions and focused on core currency formatting needs.

### `utils/productUtils.ts`
- **extractProductPrice**: Extracts price from product data
- **extractProductStock**: Extracts stock information from product
- **getProductImageUrl**: Gets product image URL with fallback
- **PRODUCT_PLACEHOLDER_SVG**: SVG placeholder for missing product images

---

## 📁 Types

### `types/performance.d.ts`
- **PerformanceEventTiming**: Interface for performance event timing data

---

## � Additional Files

### `lib/api-client.ts`
OpenAPI-generated API client with type-safe methods:
- **ApiClient**: Main API client class with authentication
- **HTTP methods**: GET, POST, PUT, DELETE with proper error handling
- **Authentication**: Bearer token management
- **Response handling**: Direct Laravel pagination support

### `lib/modules/products.ts`
OpenAPI-generated products API module:
- **ProductsApi**: Type-safe products API methods
- **getProducts**: Paginated product fetching
- **Product interfaces**: Complete product type definitions

### `lib/modules/contacts.ts`
OpenAPI-generated contacts API module:
- **ContactsApi**: Type-safe contacts API methods
- **getContacts**: Paginated contact fetching
- **Contact interfaces**: Complete contact type definitions

### `types/api.ts`
OpenAPI-generated TypeScript types:
- **PaginatedResponse<T>**: Laravel pagination response type
- **Product**: Complete product interface with variations
- **Contact**: Complete contact interface
- **User**: Extended user interface for UI compatibility
- **Business**: Business settings interface
- **API response types**: All API response interfaces

---

## �🔧 Key Features (Updated)

### Offline-First Architecture
- All data operations work offline with automatic sync when online
- Queue-based sync system with retry logic
- Local IndexedDB storage for products, customers, and sales

### Point of Sale (POS)
- Product browsing with search and category filters
- Shopping cart management
- Multiple payment methods
- Receipt generation and printing

### Sales Management
- Sales history with pagination
- Edit existing sales functionality
- Print receipts and official invoices
- Sync status tracking

### Customer Management
- Customer database with search
- Add/edit customer information
- Customer selection in POS

### Sync System
- Background sync with retry logic
- Queue management for failed operations
- Manual sync options
- Network status monitoring

### Business Settings
- Multi-location support
- Currency formatting
- Timezone handling
- Business configuration management

---

## � Key Features

### Offline-First Architecture
- All data operations work offline with automatic sync when online
- Queue-based sync system with retry logic
- Local IndexedDB storage for products, customers, and sales

### Point of Sale (POS)
- Product browsing with search and category filters
- Shopping cart management
- Multiple payment methods
- Receipt generation and printing

### Sales Management
- Sales history with pagination
- Edit existing sales functionality
- Print receipts and official invoices
- Sync status tracking

### Customer Management
- Customer database with search
- Add/edit customer information
- Customer selection in POS

### Sync System
- Background sync with retry logic
- Queue management for failed operations
- Manual sync options
- Network status monitoring

### Business Settings
- Multi-location support
- Optimized currency formatting (removed duplicate utilities)
- Timezone handling via dateUtils
- Business configuration management

---

## 📚 Dependencies (Updated)

### Core Technologies
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **React Query**: Server state management

### Storage & Sync
- **IndexedDB**: Local database storage
- **Service Workers**: Background sync capabilities

### UI Components
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Sonner**: Toast notifications

### Development
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **PWA Plugin**: Progressive Web App features

---

*Last updated: July 1, 2025 - Post OpenAPI Migration*

## 📋 Migration Summary

### What Changed
- ✅ **Removed all legacy API code** - Eliminated axios-based API calls
- ✅ **Implemented OpenAPI architecture** - Type-safe, generated API clients
- ✅ **Optimized formatting utilities** - Removed duplicates and unused functions
- ✅ **Enhanced data synchronization** - Intelligent pagination for complete sync
- ✅ **Fixed TypeScript errors** - Full type safety throughout the application

### Current State
- **Production Ready**: Full offline POS functionality with complete data sync
- **Type Safe**: OpenAPI-generated types ensure API compatibility
- **Optimized**: Clean, maintainable codebase without legacy dependencies
- **Well Documented**: Updated documentation reflects current architecture
