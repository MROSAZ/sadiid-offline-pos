# Sadiid Offline POS - Project Documentation

## Project Structure and Function Reference

This document provides a comprehensive overview of all files in the `src` folder and their functions.

---

## 📁 Root Files

### `App.tsx`
Main application component that sets up routing, contexts, and global providers.

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
- **addCustomer**: Adds new customer
- **updateCustomer**: Updates existing customer

### `context/NetworkContext.tsx`
- **NetworkProvider**: Network status context provider
- **useNetwork**: Hook for accessing network state
- **checkServerReachable**: Checks if server is reachable
- **retryOperation**: Retries failed operations with backoff

---

## 📁 Examples

### `examples/offlineFirstPatterns.ts`
- **correctSaleCreation**: Example of proper offline-first sale creation
- **correctCustomerCreation**: Example of proper offline-first customer creation
- **correctDataFetch**: Example of proper offline-first data fetching
- **handleFormSubmit**: Example form submission with offline support
- **handleSearch**: Example search with offline fallback
- **handleOnlineTransition**: Example online transition handling
- **handleOfflineTransition**: Example offline transition handling
- **robustOperation**: Example robust operation with retry logic

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
- **saveSale**: Saves sale to IndexedDB
- **getSales**: Retrieves sales from IndexedDB
- **updateSaleWithSyncedData**: Updates sale with synced API data
- **markSaleAsSynced**: Marks sale as successfully synced
- **markSaleAsSyncFailed**: Marks sale as sync failed with error

### `lib/utils.ts`
- **cn**: Utility function for combining CSS class names
- **formatCurrency**: Formats currency based on business settings
- **formatDate**: Formats dates for display
- **parseApiError**: Parses API errors into user-friendly messages

---

## 📁 Pages

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
- **login**: Authenticates user with credentials
- **getCurrentUser**: Gets current user information
- **fetchProducts**: Fetches products from API with pagination
- **fetchContacts**: Fetches contacts from API with pagination
- **createContact**: Creates new contact via API
- **createSale**: Creates new sale via API
- **fetchBusinessDetails**: Fetches business details from API
- **SaleProduct**: Interface for sale product data
- **SalePayment**: Interface for sale payment data
- **SaleData**: Interface for complete sale data

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
- **syncOfflineSales**: Syncs offline sales to server
- **processFailedOperations**: Retries failed sync operations
- **syncData**: Main sync function for all data types
- **syncDataOnLogin**: Syncs data when user logs in
- **startBackgroundSync**: Starts background sync interval
- **stopBackgroundSync**: Stops background sync interval

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
- **formatCurrencySync**: Synchronous currency formatting
- **formatNumberWithPrecision**: Formats numbers with specified precision
- **formatDate**: Formats dates with various options

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

## 🔧 Key Features

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

## 📚 Dependencies

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

*Last updated: June 23, 2025*
