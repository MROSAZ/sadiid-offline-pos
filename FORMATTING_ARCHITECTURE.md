# 🎨 Formatting Utilities - Single Source of Truth

## Overview
The Sadiid Offline POS application now has a fully consolidated formatting architecture with **`src/utils/formatting.ts`** serving as the single source of truth for all formatting utilities.

## Architecture Principles

### ✅ **Consolidated Design**
- **Single Module**: All formatting functions are centralized in one file
- **No Duplication**: Eliminated redundant functions across multiple files
- **Business-Aware**: All formatting respects business settings and timezone
- **Type-Safe**: Full TypeScript support with proper interfaces

### ✅ **Business Operations Support**
- **Sales Sync**: `formatBusinessDate` ensures all dates are in business timezone
- **Currency Display**: `formatCurrencySync` handles business currency settings
- **Error Handling**: `parseApiError` provides user-friendly error messages
- **UI Consistency**: Standardized formatting across all components

## Function Reference

### 💰 **Currency Formatting**
```typescript
formatCurrencySync(amount: number | string, settings: BusinessSettings): string
```
- **Primary currency formatter** used throughout the application
- Respects business currency symbol, placement, and precision
- Used in: POS, Sales, Product utilities

```typescript
formatNumberWithPrecision(amount: number, precision?: number, decimalSeparator?: string, thousandSeparator?: string): string
```
- **Internal helper** for number formatting with custom separators
- Supports configurable precision and separators

### 📅 **Date & Time Formatting**
```typescript
formatBusinessDate(date: Date | string, format?: Intl.DateTimeFormatOptions): string
```
- **Critical for sales sync** - formats dates in business timezone
- Ensures consistency across all date displays
- Required for proper business operations

```typescript
getBusinessTimestamp(): string
```
- **Business timezone timestamp** for ISO string generation
- Used in POS order creation and transaction logging
- Ensures accurate timezone handling

### 🚨 **Error & UI Formatting**
```typescript
parseApiError(error: any): string
```
- **User-friendly error messages** from API responses
- Handles various error response formats
- Provides consistent error display

```typescript
truncateText(text: string, maxLength?: number): string
```
- **UI text truncation** with ellipsis
- Prevents UI overflow in constrained spaces

```typescript
formatPhoneNumber(phone: string): string
```
- **Phone number display formatting**
- Supports US and Tunisia formats
- Handles various input formats

## Usage Examples

### Currency Formatting
```typescript
import { formatCurrencySync } from '@/utils/formatting';
import { getBusinessSettings } from '@/lib/businessSettings';

const settings = await getBusinessSettings();
const formatted = formatCurrencySync(123.45, settings);
// Output: "123.45 TND" or "TND123.45" based on business settings
```

### Business Date Formatting
```typescript
import { formatBusinessDate, getBusinessTimestamp } from '@/utils/formatting';

// Current timestamp in business timezone
const timestamp = getBusinessTimestamp();

// Format date for display
const displayDate = formatBusinessDate(new Date(), {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});
```

### Error Handling
```typescript
import { parseApiError } from '@/utils/formatting';

try {
  await apiCall();
} catch (error) {
  const userMessage = parseApiError(error);
  toast.error(userMessage);
}
```

## Import Patterns

### ✅ **Correct Import**
```typescript
import { formatCurrencySync, formatBusinessDate, getBusinessTimestamp } from '@/utils/formatting';
```

### ❌ **Avoid These**
```typescript
// DON'T - dateUtils.ts no longer exists
import { getBusinessTimestamp } from '@/utils/dateUtils';

// DON'T - parseApiError moved to formatting
import { parseApiError } from '@/lib/utils';
```

## Benefits of Consolidation

1. **🎯 Single Source of Truth**: All formatting logic in one place
2. **🔄 Consistency**: Standardized formatting across the entire application
3. **🛠️ Maintainability**: Easier to update and maintain formatting rules
4. **📱 Business Compliance**: All formatting respects business settings
5. **🚀 Performance**: No duplicate code, optimized imports
6. **🔍 Discoverability**: Developers know exactly where to find formatting utilities

## Documentation Updates

The following documentation has been updated to reflect this architecture:
- ✅ `DOCUMENTATION.md` - Updated function references
- ✅ `DEVELOPER_GUIDE.md` - Updated project structure
- ✅ `FINAL_CLEANUP_SUMMARY.md` - Added consolidation notes

## Future Considerations

- **New formatting functions** should be added to `src/utils/formatting.ts`
- **Business logic** requiring formatting should import from this module
- **UI components** should use these utilities for consistent display
- **API responses** should be formatted using `parseApiError` for user display

---

**Result**: The Sadiid Offline POS now has a clean, efficient, and maintainable formatting architecture that ensures business compliance and UI consistency across all features.
