# 🛠️ Sadiid Offline POS - Technical Reference

> **Quick reference for experienced developers working on the Sadiid Offline POS codebase.**

## 🏗️ Architecture Summary

### Offline-First Principles
- **Local Storage First**: All operations save to IndexedDB immediately
- **Background Sync**: Server communication happens transparently
- **Never Block UI**: Network operations are always async and non-blocking
- **Eventual Consistency**: Local data syncs to server when available

### Core Technology Stack
```
React 18 + TypeScript + Vite
├── Storage: IndexedDB (via idb)
├── UI: Tailwind CSS + shadcn/ui
├── State: React Context API
├── Sync: Custom queue system
└── API: Axios + OAuth 2.0
```

---

## 📁 Critical File Map

### Data Layer
| File | Purpose | Key Functions |
|------|---------|---------------|
| `lib/storage.ts` | IndexedDB operations | `saveSale()`, `getProducts()`, `saveContacts()` |
| `services/syncQueue.ts` | Queue management | `queueOperation()`, `processQueue()` |
| `services/syncService.ts` | Background sync | `syncData()`, `startBackgroundSync()` |
| `services/api.ts` | Server communication | `createSale()`, `fetchProducts()` |

### Business Logic
| File | Purpose | Key Components |
|------|---------|----------------|
| `pages/POS.tsx` | Point of sale | Main POS interface |
| `pages/Sales.tsx` | Sales management | Sales history, editing, printing |
| `context/CartContext.tsx` | Shopping cart | Cart state management |
| `context/AuthContext.tsx` | Authentication | User session management |

### Utilities
| File | Purpose | Key Functions |
|------|---------|---------------|
| `utils/formatting.ts` | Data formatting | `formatCurrency()`, `formatDate()` |
| `utils/apiUtils.ts` | API helpers | `withRetry()`, `delay()` |
| `utils/backgroundSync.ts` | Background tasks | `queueBackgroundTask()` |

---

## 🔄 Data Flow Patterns

### 1. User Action Pattern
```typescript
// Standard pattern for all user operations
const handleUserAction = async (data) => {
  try {
    // 1. Save locally (instant)
    const localId = await saveDataLocally(data);
    
    // 2. Queue for sync (instant)
    await queueOperation('type', { local_id: localId, data });
    
    // 3. Update UI (instant)
    updateUIState(data);
    toast.success('Action completed');
    
    // Background sync handles server communication
  } catch (error) {
    toast.error('Failed to save locally');
  }
};
```

### 2. Data Loading Pattern
```typescript
// Standard pattern for loading data
const loadData = async () => {
  try {
    // 1. Load from local storage (instant)
    const localData = await getLocalData();
    setData(localData);
    
    // 2. Background refresh if online
    if (navigator.onLine) {
      queueBackgroundTask('REFRESH_DATA', async () => {
        const freshData = await fetchDataFromAPI();
        await saveDataLocally(freshData);
        setData(freshData);
      });
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
};
```

### 3. Sync Operation Pattern
```typescript
// Background sync pattern (never blocks UI)
const syncOperation = async (operation) => {
  try {
    await updateOperationStatus(operation.id, 'processing');
    
    const response = await apiCall(operation.data);
    
    if (response.success) {
      await markLocalDataAsSynced(operation.data.local_id);
      await updateOperationStatus(operation.id, 'completed');
    } else {
      await updateOperationStatus(operation.id, 'failed', response.error);
    }
  } catch (error) {
    await updateOperationStatus(operation.id, 'failed', error.message);
  }
};
```

---

## 🗄️ Database Schema (IndexedDB)

### Sales Store
```typescript
interface Sale {
  local_id: string;           // Generated locally
  id?: number;               // From server after sync
  contact_id: number;
  location_id: number;
  transaction_date: string;
  final_total: number;
  sell_lines: SellLine[];
  payment_lines: PaymentLine[];
  is_synced: 0 | 1;         // Sync status
  sync_error?: string;      // Error message if sync failed
  invoice_url?: string;     // Server invoice URL
}
```

### Sync Queue Store
```typescript
interface QueuedOperation {
  id: string;
  type: 'sale' | 'customer' | 'attendance';
  data: any;
  createdAt: string;
  attempts: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
}
```

### Products Store
```typescript
interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  category_id: number;
  product_variations?: ProductVariation[];
  image_url?: string;
}
```

---

## 🔌 API Integration

### Authentication
```typescript
// OAuth 2.0 flow
const response = await api.post('/oauth/token', {
  grant_type: 'password',
  username,
  password,
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  scope: '*'
});
```

### Standard API Response Format
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

### Key Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/connector/api/sell` | POST | Create sale |
| `/connector/api/sell/{id}` | PUT | Update sale |
| `/connector/api/sell` | GET | Fetch sales |
| `/connector/api/products` | GET | Fetch products |
| `/connector/api/contacts` | GET | Fetch customers |
| `/connector/api/user` | GET | Current user |

---

## 🔄 Sync System Architecture

### Queue Processing
```typescript
// Automatic background sync every 1 minute
const SYNC_INTERVAL_MS = 1 * 60 * 1000;

// Queue processing flow
processQueue() {
  const pendingOps = await getOperationsByStatus('pending');
  
  for (const op of pendingOps) {
    switch (op.type) {
      case 'sale': await processSaleOperation(op); break;
      case 'customer': await processCustomerOperation(op); break;
      case 'attendance': await processAttendanceOperation(op); break;
    }
  }
}
```

### Network Event Handling
```typescript
// Auto-sync on network reconnection
window.addEventListener('online', () => {
  processQueue();
  startBackgroundSync();
});

window.addEventListener('offline', () => {
  stopBackgroundSync();
});
```

---

## 🎯 Component Patterns

### Context Usage
```typescript
// Cart context pattern
const { cart, addItem, clearCart, setCustomer } = useCart();

// Network context pattern
const { isOnline, retryOperation } = useNetwork();

// Auth context pattern
const { user, isAuthenticated, logout } = useAuth();
```

### Error Boundaries
```typescript
// Always handle local storage errors
try {
  await saveData(data);
  toast.success('Saved successfully');
} catch (error) {
  toast.error('Failed to save locally');
  console.error('Storage error:', error);
}

// Never handle network errors in UI components
// Let background sync handle retry logic
```

### Loading States
```typescript
// Local data loads instantly - no loading states
const [data, setData] = useState([]);

useEffect(() => {
  loadLocalData(); // Instant load
  // Background refresh happens separately
}, []);
```

---

## 🛠️ Development Utilities

### Debugging Sync Issues
```typescript
// Check queue status
import { getQueueStats } from '@/services/syncQueue';
const stats = await getQueueStats();
console.log('Queue stats:', stats);

// Check unsynced data
import { getUnSyncedSales } from '@/lib/storage';
const unsynced = await getUnSyncedSales();
console.log('Unsynced sales:', unsynced);

// Manual sync trigger
import { processQueue } from '@/services/syncQueue';
await processQueue();
```

### Testing Offline Functionality
```bash
# Chrome DevTools
# 1. Open DevTools → Network tab
# 2. Check "Offline" checkbox
# 3. Test all functionality

# Programmatically
Object.defineProperty(navigator, 'onLine', {
  value: false,
  writable: true
});
```

### Performance Monitoring
```typescript
// Monitor IndexedDB performance
const start = performance.now();
await saveData(data);
const duration = performance.now() - start;
console.log(`Save operation took ${duration}ms`);

// Monitor sync success rates
const stats = await getQueueStats();
const successRate = stats.completed / stats.total;
console.log(`Sync success rate: ${successRate * 100}%`);
```

---

## 📋 Common Operations Reference

### Creating New Sale
```typescript
const saleData = {
  contact_id: customer.id,
  location_id: selectedLocation.id,
  final_total: cart.total,
  sell_lines: cart.items.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.price
  })),
  payment_lines: [{
    amount: cart.total,
    method: 'cash'
  }]
};

const saleId = await saveSale(saleData);
await queueOperation('sale', { local_id: saleId, saleData });
```

### Updating Existing Sale
```typescript
const updatedData = { ...existingSale, final_total: newTotal };
await updateSale(saleId, updatedData);
await queueOperation('sale', { local_id: saleId, saleData: updatedData });
```

### Adding New Customer
```typescript
const customerData = { name, email, mobile };
const customerId = await saveContact(customerData);
await queueOperation('customer', { local_id: customerId, customerData });
```

---

## 🚨 Critical Rules

### ❌ Never Do
- Block UI waiting for network calls
- Make functionality dependent on network status
- Skip local storage for user operations
- Ignore sync queue for server operations
- Handle network errors in UI components

### ✅ Always Do
- Save to IndexedDB first
- Queue operations for background sync
- Provide instant UI feedback
- Handle local storage errors only
- Use context for shared state

---

## 🔧 Build & Deployment

### Build Process
```bash
npm run build         # Production build
npm run preview       # Test production build
npm run type-check    # TypeScript validation
```

### Environment Variables
```env
VITE_API_BASE_URL=https://erp.sadiid.net
VITE_APP_NAME=Sadiid POS
VITE_APP_VERSION=1.0.0
```

### PWA Configuration
- Service worker for caching
- Offline functionality
- Installable app
- Background sync capabilities

---

*Technical Reference - Last Updated: June 23, 2025 - Includes sales editing and printing functionality*
