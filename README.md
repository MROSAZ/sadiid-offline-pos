# 🏪 Sadiid Offline POS - Modern React PWA

> **🚀 Production-Ready** | **🔄 Offline-First** | **📱 Mobile-Optimized** | **🔒 Type-Safe**

A modern, offline-first Point of Sale (POS) system built with React, TypeScript, and shadcn/ui. Features real-time data synchronization, comprehensive offline capabilities, and seamless integration with the Sadiid ERP backend using OpenAPI-driven type-safe APIs.

---

## 📋 Quick Navigation

### 🎯 For New Developers
- 🚀 **[Developer Onboarding Guide](DEVELOPER_ONBOARDING.md)** - Get started in 15 minutes
- 🛠️ **[Technical Reference](TECHNICAL_REFERENCE.md)** - Architecture & patterns
- 🔧 **[Setup & Installation](DEPLOYMENT_GUIDE.md)** - Environment configuration

### 📚 Documentation & Guides  
- 🏗️ **[Complete Documentation](DOCUMENTATION.md)** - Detailed file and function reference
- 🔌 **[OpenAPI Integration](docs/OPENAPI_INTEGRATION_GUIDE.md)** - Type-safe API usage
- 🌐 **[API Documentation](API_DOCUMENTATION.md)** - Complete endpoint reference
- 🚀 **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment

---

## ✨ Key Features

### 🔄 Offline-First Architecture
- **Complete offline functionality** - Works without internet connection
- **Intelligent data sync** - Automatic background synchronization with pagination
- **OpenAPI-driven APIs** - Type-safe, well-documented API integration
- **Local data persistence** - IndexedDB for reliable storage

### 🏪 POS Core Features
- **Product management** - Categories, variants, inventory tracking with full pagination
- **Customer management** - Complete contact database with CRM features
- **Sales processing** - Quick checkout, payment methods, receipts
- **Edit sale functionality** - ✅ Full sales editing with proper backend updates
- **Real-time inventory** - Stock levels, alerts, location-based tracking

### 🔒 Enterprise-Ready
- **OAuth 2.0 authentication** - Secure token-based auth with automatic refresh
- **Type-safe API client** - OpenAPI-generated types and validation
- **Modular architecture** - Clean separation of concerns
- **Comprehensive error handling** - Robust error management and recovery

### 📱 Modern User Experience  
- **Progressive Web App (PWA)** - Install on any device
- **Responsive design** - Works on desktop, tablet, mobile
- **shadcn/ui components** - Beautiful, accessible UI
- **Real-time feedback** - Loading states, error handling, notifications

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **npm 9+** or **yarn 1.22+**
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/sadiid-offline-pos.git
cd sadiid-offline-pos

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API configuration

# Start development server
npm run dev

# Build for production
npm run build
```

### First Time Setup

1. **Configure API Settings** - Update `.env.local` with your Sadiid ERP credentials
2. **Login** - Use your Sadiid ERP username/password
3. **Select Location** - Choose your business location
4. **Sync Data** - Initial sync will download all products, customers, and settings

---

## 🏗️ Technology Stack

### Core Framework & Language
- **⚛️ React 18** - Modern React with hooks and concurrent features
- **📘 TypeScript 5** - Full type safety with strict configuration
- **⚡ Vite 5** - Fast development server and optimized builds
- **🎨 shadcn/ui** - Beautiful, accessible UI components built on Radix

### OpenAPI Integration
- **📋 OpenAPI 3.0** - Complete API specification and documentation
- **🔒 Type-safe API client** - Auto-generated TypeScript types
- **🧩 Modular API design** - Organized by functional areas
- **🔄 Automatic pagination** - Intelligent data fetching

### Data & State Management
- **🗄️ IndexedDB** - Client-side database for offline storage
- **🔄 React Context** - Global state management
- **📡 Axios** - HTTP client with interceptors and retry logic
- **🔄 Background Sync** - Service worker-based synchronization

### Styling & UI
- **🎯 Tailwind CSS** - Utility-first CSS framework
- **🧩 Radix UI** - Headless UI primitives for accessibility
- **🎨 Lucide Icons** - Beautiful, consistent iconography
- **📱 Responsive Design** - Mobile-first approach

### Development & Build Tools
- **🔍 ESLint** - Code linting with strict rules
- **💅 Prettier** - Consistent code formatting
- **📦 PostCSS** - CSS processing and optimization
- **🔧 TypeScript Compiler** - Strict type checking

---

## 📦 Project Structure

```
sadiid-offline-pos/
├── 📁 src/
│   ├── 📁 components/          # Reusable UI components
│   │   ├── 📁 ui/             # shadcn/ui base components
│   │   ├── 📁 auth/           # Authentication components
│   │   ├── 📁 pos/            # POS-specific components
│   │   ├── 📁 customers/      # Customer management
│   │   ├── 📁 products/       # Product management
│   │   └── 📁 layouts/        # Layout components
│   ├── 📁 pages/              # Route/page components
│   ├── 📁 lib/                # Core utilities & OpenAPI client
│   │   ├── 📁 modules/        # API modules (products, contacts, etc.)
│   │   ├── api-client.ts      # Main OpenAPI client
│   │   ├── storage.ts         # IndexedDB abstraction
│   │   └── utils.ts           # Utility functions
│   ├── 📁 services/           # Business logic services
│   │   ├── api.ts             # Clean API service (OpenAPI-driven)
│   │   ├── syncService.ts     # Background synchronization
│   │   └── locationService.ts # Business location management
│   ├── 📁 context/            # React Context providers
│   ├── 📁 hooks/              # Custom React hooks
│   ├── 📁 types/              # TypeScript type definitions
│   │   └── api.ts             # OpenAPI-generated types
│   └── 📁 utils/              # Helper functions
├── 📁 docs/                   # Technical documentation
│   └── openapi.yaml          # Complete API specification
├── 📁 public/                 # Static assets & PWA config
└── 📄 Configuration files
```

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Check TypeScript types |

---

## 🌍 Environment Configuration

Create `.env.local` with your configuration:

```env
# Sadiid ERP API Configuration
VITE_API_BASE_URL=https://erp.sadiid.net
VITE_OAUTH_CLIENT_ID=your_client_id
VITE_OAUTH_CLIENT_SECRET=your_client_secret

# Application Settings
VITE_APP_NAME="Sadiid POS"
VITE_APP_VERSION=1.0.0

# Development Settings (optional)
VITE_DEBUG_MODE=false
VITE_ENABLE_MOCK_DATA=false
```

---

## 🔄 OpenAPI-Driven Architecture

### Type-Safe API Integration
- **Auto-generated types** from OpenAPI specification
- **Modular API clients** organized by functionality
- **Comprehensive error handling** with proper typing
- **Automatic request/response validation**

### API Modules Structure
```typescript
// Clean, type-safe API calls
import { ProductsApi, ContactsApi } from '@/services/api';

// Fully typed responses
const products: Product[] = await ProductsApi.getProducts();
const contacts: Contact[] = await ContactsApi.getContacts();
```

### Intelligent Pagination
- **Automatic page fetching** for complete offline sync
- **Configurable per-page limits** for optimal performance
- **Smart caching** to minimize API calls
- **Background updates** without blocking UI

---

## 🔄 Data Synchronization Strategy

### Initial Sync (Login)
- Downloads **ALL** products across all pages
- Downloads **ALL** customers/contacts
- Fetches business settings and locations
- Stores everything locally in IndexedDB

### Background Sync
- **Smart scheduling** based on data freshness
- **Incremental updates** for changed data
- **Conflict resolution** for concurrent edits
- **Error retry logic** with exponential backoff

### Offline Mode
- **Full POS functionality** without internet
- **Local data persistence** with IndexedDB
- **Queue pending operations** for later sync
- **Seamless online/offline transitions**

---

## 📱 Progressive Web App (PWA)

### Installation & Caching
- **Installable** on desktop and mobile devices
- **Service worker** for offline functionality
- **App shell caching** for instant loading
- **Background sync** for data updates

### Mobile Experience
- **Touch-optimized** interface
- **Responsive design** for all screen sizes
- **Fast navigation** with client-side routing
- **Native app feel** with proper metadata

---

## 🤝 Contributing

### Getting Started
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow code standards** (ESLint + Prettier configured)
4. **Write tests** for new functionality
5. **Update documentation** as needed

### Code Standards
- **TypeScript strict mode** - No `any` types allowed
- **ESLint configuration** - Enforced code quality
- **Prettier formatting** - Consistent code style
- **OpenAPI compliance** - All API changes must update the spec

### Pull Request Process
1. **Update documentation** for any new features
2. **Run the test suite**: `npm run test` (when available)
3. **Type checking**: `npm run type-check`
4. **Linting**: `npm run lint`
5. **Build verification**: `npm run build`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

- 📧 **Email**: support@sadiid.net
- 🌐 **Website**: [https://sadiid.net](https://sadiid.net)
- 📚 **Documentation**: Complete guides in the `/docs` folder
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-org/sadiid-offline-pos/issues)

---

## 🏆 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Radix UI** for accessible primitives  
- **Tailwind CSS** for the utility-first CSS framework
- **OpenAPI Initiative** for standardized API documentation
- **React Team** for the amazing framework
- **TypeScript Team** for static typing excellence

---

*Built with ❤️ by the Sadiid Team using modern web technologies*

├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Page components (routes)
├── services/           # API and external services
├── types/              # TypeScript type definitions
└── utils/              # Helper utilities
```

### Component Hierarchy
```
App
├── AppInitializer (Data loading)
├── AuthContext (Authentication state)
├── NetworkContext (Network status)
├── BusinessSettingsContext (Business configuration)
├── CartContext (Shopping cart state)
├── CustomerContext (Customer selection)
└── Router
    ├── ProtectedLayout
    │   ├── Header
    │   ├── Sidebar
    │   └── Page Components
    └── Login (Public route)
```

## Core Features

### 1. Point of Sale (POS)
**File**: [`src/pages/POS.tsx`](src/pages/POS.tsx)

The POS interface is the heart of the application, providing:
- **Product Grid**: Visual product catalog with search and filtering
- **Cart Management**: Real-time cart updates with quantity controls
- **Customer Selection**: Quick customer lookup and assignment
- **Payment Processing**: Multiple payment methods support
- **Receipt Generation**: Automatic receipt creation and printing

**Key Components**:
- [`POSProductGrid`](src/components/pos/POSProductGrid.tsx): Displays products in a grid layout
- [`POSOrderDetails`](src/components/pos/POSOrderDetails.tsx): Shopping cart and checkout interface
- [`POSCategoryFilters`](src/components/pos/POSCategoryFilters.tsx): Product category filtering

### 2. Product Management
**File**: [`src/pages/Products.tsx`](src/pages/Products.tsx)

Comprehensive product catalog management:
- **Product Listing**: Paginated product display
- **Search & Filter**: Advanced product search capabilities
- **Inventory Tracking**: Real-time stock level monitoring
- **Category Management**: Product categorization system

### 3. Customer Management
**File**: [`src/pages/Customers.tsx`](src/pages/Customers.tsx)

Customer relationship management features:
- **Customer Database**: Complete customer information storage
- **Purchase History**: Track customer transaction history
- **Contact Information**: Phone, email, and address management
- **Customer Search**: Quick customer lookup by name or phone

### 4. Sales Management
**File**: [`src/pages/Sales.tsx`](src/pages/Sales.tsx)

Complete sales management and analytics:
- **Transaction History**: Complete sales record keeping with pagination
- **Sales Editing**: Edit any sale (synced or local) with full cart integration
- **Print Functionality**: Generate receipts and bills, works offline
- **Sync Status Monitoring**: Real-time sync status for each transaction
- **Payment Details**: Track payment methods and amounts
- **Business Reporting**: Sales performance metrics and analytics

**Recent Features**:
- Edit sales with automatic cart prefill and customer assignment
- Print receipts (app-generated) and bills (server URLs) 
- Handle both synced and local sales seamlessly
- Comprehensive error handling and user feedback

## Database Design

### IndexedDB Schema

The application uses IndexedDB for offline data storage with the following stores:

#### 1. Products Store
```typescript
interface Product {
  id: number;
  name: string;
  type: 'single' | 'variable';
  image?: string;
  enable_stock: 1 | 0;
  unit_id: number;
  brand_id: number;
  category_id: number;
  sub_category_id?: number;
  product_description?: string;
  selling_price: number;
  selling_price_inc_tax: number;
  variations?: ProductVariation[];
  media?: ProductMedia[];
}
```

#### 2. Contacts Store
```typescript
interface Contact {
  id: number;
  type: 'customer' | 'supplier';
  supplier_business_name?: string;
  name: string;
  prefix?: string;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  contact_id: string;
  mobile: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
}
```

#### 3. Sales Store
```typescript
interface Sale {
  local_id: string;
  contact_id: number;
  location_id: number;
  transaction_date: string;
  final_total: number;
  tax_amount: number;
  discount_amount: number;
  sell_lines: SellLine[];
  payment_lines: PaymentLine[];
  is_synced: boolean;
  created_at: string;
}
```

#### 4. Sync Queue Store
```typescript
interface QueuedOperation {
  id: string;
  type: 'sale' | 'customer' | 'attendance';
  data: any;
  createdAt: string;
  attempts: number;
  lastAttempt?: string;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
}
```

## Synchronization System

### Architecture Overview

The synchronization system is built on an **offline-first** principle where all user interactions are stored locally first, then synchronized with the server in the background.

#### 1. Sync Service (`src/services/syncService.ts`)
Handles the main synchronization logic:
- **Background Synchronization**: All sync happens in background, never blocking UI
- **Data Freshness Checking**: Determines when data needs updating from server
- **Batch Synchronization**: Efficient bulk data transfer
- **Retry Logic**: Automatic retry for failed operations with exponential backoff
- **Progress Tracking**: Real-time sync status updates
- **Network Event Handling**: Responds to online/offline status changes

#### 2. Sync Queue (`src/services/syncQueue.ts`)
Manages all operations queue (both online and offline):
- **Operation Queuing**: Store ALL user actions for later sync
- **Queue Processing**: Batch process queued operations when online
- **Error Handling**: Retry failed operations with exponential backoff
- **Queue Persistence**: Maintain queue across app restarts and network changes
- **Status Tracking**: Monitor operation states (pending, processing, completed, failed)
- **Cleanup**: Automatic cleanup of completed operations

### Offline-First Data Flow

```mermaid
graph TD
    A[User Action] --> B[Store in IndexedDB]
    B --> C[Queue Operation]
    C --> D[Update UI Immediately]
    E[Background Sync Process] --> F{Network Available?}
    F -->|Yes| G[Process Queue]
    F -->|No| H[Wait for Network]
    G --> I[Send to Server]
    I --> J{Success?}
    J -->|Yes| K[Mark as Synced]
    J -->|No| L[Retry with Backoff]
    H --> F
    L --> G
```

### Sync Strategies

#### 1. User Actions (Client → Queue → Server)
**All user actions follow this pattern:**
- **Sales Transactions**: Store → Queue → Sync to server
- **Customer Creation/Updates**: Store → Queue → Sync to server  
- **Inventory Changes**: Store → Queue → Sync to server
- **Attendance Records**: Store → Queue → Sync to server

**Key Principle**: Never block the user interface waiting for network calls.

#### 2. Data Updates (Server → Client)
**Background data refresh:**
- **Products**: Fetch fresh data every 24 hours or on demand
- **Customers**: Fetch updates every 6 hours or on demand
- **Business Settings**: Fetch on login and periodically
- **Categories**: Fetch with products or separately

### Implementation Details

#### Offline-First User Flow Example:
```typescript
// ❌ WRONG - Direct API call when online
if (isOnline) {
  await createSale(saleData);
} else {
  await saveSaleLocally(saleData);
}

// ✅ CORRECT - Always store locally first
await saveSale(saleData); // Always saves to IndexedDB
await queueOperation('sale', saleData); // Always queues for sync
// Background process handles sync when network available
```

#### Queue Processing Logic:
```typescript
export const processQueue = async (): Promise<void> => {
  if (!navigator.onLine) return;
  
  const pendingOps = await getOperationsByStatus('pending');
  
  for (const operation of pendingOps) {
    try {
      await updateOperationStatus(operation.id, 'processing');
      
      switch (operation.type) {
        case 'sale':
          await syncSaleToServer(operation.data);
          break;
        case 'customer':
          await syncCustomerToServer(operation.data);
          break;
        // ... other operation types
      }
      
      await updateOperationStatus(operation.id, 'completed');
    } catch (error) {
      await updateOperationStatus(operation.id, 'failed', error.message);
    }
  }
};
```

### Data Consistency Strategy

#### 1. Local-First Operations
- **Immediate Response**: UI updates instantly from local data
- **Eventual Consistency**: Server sync happens in background
- **Conflict Resolution**: Last-write-wins with timestamp comparison
- **Data Integrity**: Local validation before queuing

#### 2. Server Data Updates
- **Pull-Based**: Client requests fresh data periodically
- **Incremental Sync**: Only fetch changes since last sync
- **Merge Strategy**: Merge server updates with local changes
- **Fallback**: Always prefer local data if server unavailable

#### 3. Network State Handling
```typescript
// Network becomes available
window.addEventListener('online', () => {
  processQueue(); // Start processing pending operations
  syncDataFromServer(); // Fetch fresh data from server
});

// Network becomes unavailable  
window.addEventListener('offline', () => {
  // Continue normal operation with local data
  // All operations continue to be queued
});
```
## Code Structure

### State Management Pattern

The application uses a combination of React Context and local state with offline-first principles:

#### 1. Global State (Context)
- **AuthContext**: User authentication state
- **CartContext**: Shopping cart state (always local)
- **CustomerContext**: Selected customer state (from IndexedDB)
- **NetworkContext**: Network connection status
- **BusinessSettingsContext**: Business configuration (cached locally)

#### 2. Local State (Component)
- **UI State**: Component-specific UI state
- **Form State**: Form input and validation state
- **Loading States**: Background sync operation status (never blocks UI)

### Data Flow Pattern

```mermaid
graph LR
    A[User Interaction] --> B[Component]
    B --> C[Local Storage - IndexedDB]
    C --> D[Queue Operation]
    D --> E[Update UI State]
    F[Background Sync] --> G[Process Queue]
    G --> H[API/Server]
    H --> I[Update Sync Status]
```

**Key Principles:**
1. **User interactions never wait for network**
2. **All data flows through IndexedDB first**
3. **UI always reflects local state**
4. **Sync happens transparently in background**

### Error Handling Strategy

#### 1. Network Independence
```typescript
// ❌ WRONG - Network-dependent error handling
try {
  if (isOnline) {
    await createSale(saleData);
  } else {
    throw new Error('Cannot create sale while offline');
  }
} catch (error) {
  showError('Sale creation failed');
}

// ✅ CORRECT - Network-independent operation
try {
  await saveSale(saleData); // Always succeeds locally
  await queueOperation('sale', saleData); // Always queues
  showSuccess('Sale created successfully'); // Always shows success
} catch (error) {
  showError('Failed to save sale locally'); // Only fails on storage issues
}
```

#### 2. Background Sync Error Handling
```typescript
// Background sync handles network errors gracefully
export const syncSaleToServer = async (saleData: any) => {
  try {
    const result = await createSale(saleData);
    if (result.success) {
      await markSaleAsSynced(saleData.local_id);
      return true;
    }
    throw new Error(result.error);
  } catch (error) {
    // Schedule retry with exponential backoff
    await scheduleRetry(saleData, error);
    return false;
  }
};
```

#### 3. Component Error Boundaries
- **Graceful Degradation**: Handle component errors gracefully
- **User Feedback**: Show meaningful status messages about sync
- **Error Recovery**: Provide manual sync retry mechanisms

## Offline Capabilities

### Offline-First Design

The application is built with a true offline-first approach where **network connectivity is treated as an enhancement, not a requirement**.

#### 1. Data Availability
- **Complete Product Catalog**: Full product database stored locally
- **Customer Information**: Complete customer database offline
- **Business Settings**: All configuration data available offline
- **Transaction History**: All transactions stored locally immediately

#### 2. Functionality Preservation
- **Sales Processing**: Complete POS functionality always available
- **Customer Management**: Add and edit customers without network
- **Product Browsing**: Full product catalog access offline
- **Report Generation**: All reporting from local data

#### 3. Queue Management
**File**: [`src/services/syncQueue.ts`](src/services/syncQueue.ts)

All operations are queued regardless of network status:

```typescript
export const queueOperation = async (
  type: QueueableOperationType, 
  data: any
): Promise<string> => {
  const operation: QueuedOperation = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    data,
    createdAt: new Date().toISOString(),
    attempts: 0,
    status: 'pending'
  };
  
  const db = await initSyncQueueDB();
  await db.add(QUEUE_STORE_NAME, operation);
  
  // If online, start background processing
  if (navigator.onLine) {
    processQueue(); // Non-blocking background process
  }
  
  return operation.id;
};
```

#### 4. User Experience Principles

**Immediate Feedback:**
- All user actions complete instantly
- UI never shows loading states for user operations
- Success messages appear immediately after local storage

**Background Sync Indicators:**
- Subtle sync status indicators in UI
- Non-intrusive notifications for sync completion
- Clear indication of items pending sync

**Network Transparency:**
- Application works identically online and offline
- Network status visible but doesn't change functionality
- Automatic sync when network becomes available

### Network Status Monitoring
**File**: [`src/context/NetworkContext.tsx`](src/context/NetworkContext.tsx)

Network monitoring is used for sync optimization, not functionality:

```typescript
export const NetworkContext = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Start background sync - never blocks UI
      processQueue();
      syncDataFromServer();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      // Application continues normally
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
};
```

**Key Features:**
- **Background Sync Trigger**: Start sync when connection restored
- **User Notifications**: Inform users of sync status (not functionality status)
- **Graceful Enhancement**: Online connectivity enhances but doesn't enable features

## Performance Optimizations

#### 1. Offline-First Optimizations
```typescript
// Instant local operations
const addToCart = async (product: Product) => {
  // Immediate UI update
  updateCartState(product);
  
  // Background storage (non-blocking)
  saveCartToStorage(cartState);
};

// Background sync optimization
const debouncedSync = debounce(processQueue, 5000); // Batch sync operations
```

#### 2. Storage Optimizations
```typescript
// Batch IndexedDB operations for better performance
export const batchSaveOperations = async (operations: QueuedOperation[]) => {
  const db = await initSyncQueueDB();
  const tx = db.transaction('operations', 'readwrite');
  
  for (const operation of operations) {
    tx.store.add(operation);
  }
  
  await tx.done;
};
```

#### 3. Background Processing
- **Non-blocking Sync**: All sync operations happen in background
- **Intelligent Batching**: Group similar operations for efficiency
- **Resource Management**: Limit concurrent sync operations

## PWA Implementation

### Service Worker Configuration
**File**: [`vite.config.ts`](vite.config.ts)

The application is configured as a PWA using Vite PWA plugin:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
  manifest: {
    name: 'Sadiid POS',
    short_name: 'SadiidPOS',
    description: 'Sadiid ERP Cloud POS',
    theme_color: '#0284c7',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
})
```

### PWA Features
- **Installable**: Can be installed on desktop and mobile devices
- **Offline Support**: Full functionality without internet connection
- **Background Sync**: Sync data when connection is restored
- **Push Notifications**: Server-sent notifications (future enhancement)
- **App Shell**: Fast loading with cached shell

### Caching Strategy
- **Cache First**: Static assets (CSS, JS, images)
- **Network First**: API calls with fallback to cache
- **Stale While Revalidate**: Dynamic content with background updates

## Development & Deployment

### Development Setup

#### 1. Prerequisites
```bash
# Node.js 18+ and npm
node --version  # Should be 18+
npm --version   # Should be 8+
```

#### 2. Installation
```bash
# Clone repository
git clone <repository-url>
cd sadiid-offline-pos

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 3. Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Build Process

#### 1. TypeScript Compilation
- **Type Checking**: Full TypeScript type checking
- **Code Generation**: Compile TypeScript to JavaScript
- **Source Maps**: Generate source maps for debugging

#### 2. Asset Optimization
- **CSS Processing**: PostCSS and Tailwind compilation
- **Image Optimization**: Compress and optimize images
- **Bundle Splitting**: Code splitting for optimal loading

#### 3. PWA Generation
- **Service Worker**: Generate service worker for offline support
- **Manifest**: Create web app manifest for installation
- **Icon Generation**: Generate various icon sizes

### Deployment Strategy

#### 1. Static Hosting
The application can be deployed to any static hosting service:
- **Netlify**: Automatic deployments from Git
- **Vercel**: Optimized for React applications
- **GitHub Pages**: Free hosting for open source
- **AWS S3**: Scalable cloud hosting

#### 2. Environment Configuration
```typescript
// Environment variables
VITE_API_BASE_URL=https://erp.sadiid.net
VITE_CLIENT_ID=48
VITE_CLIENT_SECRET=cEM0njAX1oCo9OK4NDdwjEyWr1KKmjt6545j6zSf
```

#### 3. Production Optimizations
- **Gzip Compression**: Enable gzip compression
- **CDN Integration**: Use CDN for static assets
- **Caching Headers**: Set appropriate cache headers
- **Performance Monitoring**: Monitor application performance

### Testing Strategy

#### 1. Unit Testing
- **Component Testing**: Test individual components
- **Service Testing**: Test business logic
- **Utility Testing**: Test helper functions

#### 2. Integration Testing
- **API Integration**: Test API communication
- **Database Operations**: Test IndexedDB operations
- **Sync Functionality**: Test offline sync

#### 3. E2E Testing
- **User Flows**: Test complete user journeys
- **Offline Scenarios**: Test offline functionality
- **PWA Features**: Test installation and offline usage

## Development & Deployment

### Getting Started
For new developers joining the team, follow this sequence:

1. **Start Here**: [`DEVELOPER_ONBOARDING.md`](DEVELOPER_ONBOARDING.md) - Complete setup and onboarding guide
2. **Quick Reference**: [`TECHNICAL_REFERENCE.md`](TECHNICAL_REFERENCE.md) - Architecture patterns and critical files
3. **Detailed Reference**: [`DOCUMENTATION.md`](DOCUMENTATION.md) - Complete file and function reference
4. **API Integration**: [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) - Backend endpoints and examples
5. **Deployment**: [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) - Build and deployment instructions

### Build Commands
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Production build
npm run preview     # Preview production build
npm run lint        # Run code linting
```

### Environment Setup
```env
VITE_API_BASE_URL=https://erp.sadiid.net
VITE_APP_NAME=Sadiid POS
VITE_APP_VERSION=1.0.0
```

## API Documentation & Integration

### OpenAPI Specification

The project includes a comprehensive OpenAPI specification that documents all 81 API endpoints of the Sadiid ERP backend:

- **📄 OpenAPI Spec**: [`docs/openapi.yaml`](docs/openapi.yaml) - Complete API specification
- **🔗 Integration Guide**: [`docs/OPENAPI_INTEGRATION_GUIDE.md`](docs/OPENAPI_INTEGRATION_GUIDE.md) - Detailed usage instructions
- **📝 API Documentation**: [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) - Human-readable API reference
- **🧪 Postman Collection**: [`Sadiid_POS_API.postman_collection.json`](Sadiid_POS_API.postman_collection.json) - Interactive testing

### API Categories

The API is organized into functional areas:

| Category | Endpoints | Description |
|----------|-----------|-------------|
| 🔐 **Authentication** | 8 | OAuth2, user registration, password management |
| 🏢 **Business Management** | 7 | Business details, locations, subscriptions |
| 📦 **Product Management** | 12 | Products, inventory, categories, brands |
| 💰 **Sales & POS** | 15 | Transactions, payments, returns, cash register |
| 👥 **Customer Management** | 8 | Contacts, CRM, follow-ups, leads |
| 💸 **Expense Management** | 4 | Expense tracking, categories, refunds |
| 📊 **Reporting** | 2 | Sales reports, profit/loss, stock reports |
| 👨‍💼 **Field Force** | 3 | Visit tracking, status updates |
| ⚙️ **System Admin** | 15 | Users, settings, attendance |
| 🔌 **Integration** | 7 | API clients, connectors |

### Type Safety

The project includes comprehensive TypeScript types for all API endpoints:

- **📁 Type Definitions**: [`src/types/api.ts`](src/types/api.ts) - Complete type definitions
- **🔒 Request/Response Types**: Fully typed API interactions
- **✅ Validation Support**: Request validation against OpenAPI spec
- **🎯 IntelliSense**: Full IDE support and autocomplete

### Interactive Documentation

**View the API documentation interactively:**

1. **Swagger UI Online**: Upload [`docs/openapi.yaml`](docs/openapi.yaml) to [Swagger Editor](https://editor.swagger.io/)
2. **Local Swagger UI**: 
   ```bash
   npm install -g swagger-ui-serve
   swagger-ui-serve docs/openapi.yaml
   ```
3. **Postman**: Import the collection for interactive testing and exploration

### Development Integration

The OpenAPI specification enables:

- **🔧 Code Generation**: Generate TypeScript clients and types
- **🧪 Mock Servers**: Create mock APIs for frontend development
- **✅ Contract Testing**: Ensure frontend/backend compatibility
- **📋 Request Validation**: Validate API requests before sending
- **🎯 Type Safety**: Full TypeScript integration with generated types

See the [OpenAPI Integration Guide](docs/OPENAPI_INTEGRATION_GUIDE.md) for detailed setup instructions and best practices.

---

## 🛠️ Development Guide

### Quick Start for Developers

```bash
# Clone and setup
git clone <repository-url>
cd sadiid-offline-pos
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run TypeScript checks
npm run type-check

# Run linting
npm run lint
```

### Key Development Patterns

#### Offline-First Architecture
- **Local Storage First**: All operations save to IndexedDB immediately
- **Background Sync**: Server communication happens transparently
- **Never Block UI**: Network operations are always async and non-blocking
- **Eventual Consistency**: Local data syncs to server when available

#### Data Flow
```
User Action → IndexedDB → UI Update → Background Sync → Server → Local Update
```

#### Context Usage
- **AuthContext**: User authentication and session management
- **CartContext**: Shopping cart state and edit sale functionality
- **NetworkContext**: Online/offline status detection
- **BusinessSettingsContext**: Business configuration and currency settings

#### API Integration
- **Type-safe clients**: OpenAPI-generated TypeScript clients
- **Automatic retries**: Built-in retry logic for failed requests
- **Request validation**: Schema validation before API calls
- **Response handling**: Unified error handling across all endpoints

### Development Tools

#### VS Code Extensions (Recommended)
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter

#### Build Tools
- **Vite**: Fast development server with HMR
- **TypeScript**: Strict type checking
- **ESLint**: Code linting with React rules
- **Prettier**: Code formatting

#### Testing
- **Component Testing**: React Testing Library
- **API Testing**: OpenAPI contract testing
- **E2E Testing**: Playwright (configured but not implemented)

### Project Structure
```
src/
├── components/          # Reusable UI components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Core utilities and API clients
├── pages/              # Page components
├── services/           # Business logic and API services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Best Practices

#### State Management
- Use React Context for global state
- Keep component state local when possible
- Implement optimistic updates for better UX

#### Error Handling
- Always provide user feedback for errors
- Log errors for debugging but don't expose sensitive info
- Implement retry logic for transient failures

#### Performance
- Lazy load components when appropriate
- Use React.memo for expensive renders
- Implement virtual scrolling for large lists

#### TypeScript
- Use strict TypeScript configuration
- Define proper interfaces for all data structures
- Leverage OpenAPI-generated types

---

## Conclusion

The Sadiid Offline POS application represents a mature offline-first point-of-sale solution. Its architecture ensures that **users can always complete their work immediately**, regardless of network connectivity, while background synchronization maintains data consistency with the server.

**Core Strengths:**
- **Reliability**: Never dependent on network connectivity
- **Performance**: Instant response to all user actions
- **User Experience**: Consistent behavior online and offline
- **Data Integrity**: Robust queue system with retry logic prevents data loss
- **Scalability**: Background sync scales with usage patterns
- **Maintainability**: Comprehensive documentation for team onboarding

**Key Features Implemented:**
- Complete POS functionality with offline support
- Sales editing and printing capabilities
- Customer and product management
- Real-time sync with error handling
- PWA installation and offline caching
- Comprehensive error reporting and user feedback

The application is production-ready and provides a reliable foundation for retail operations in any network environment.

---

*Last Updated: June 23, 2025*
*Version: 1.0.0*
*Status: Production Ready - Complete Offline-First Architecture*
