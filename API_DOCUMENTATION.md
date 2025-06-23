# API Documentation

## Overview

This document describes the API endpoints used by the Sadiid Offline POS application. All endpoints require authentication via OAuth 2.0 Bearer tokens.

## Base URL
```
https://erp.sadiid.net/connector/api
```

## Authentication

### Login
```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&username=USERNAME&password=PASSWORD&scope=*
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 31536000,
  "refresh_token": "def50200..."
}
```

### Headers for Authenticated Requests
```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

## User Management

### Get Current User
```http
GET /user
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "language": "en"
  }
}
```

## Business Configuration

### Get Business Details
```http
GET /business-details
```

**Response:**
```json
{
  "data": {
    "name": "My Business",
    "currency": {
      "symbol": "$",
      "code": "USD",
      "thousand_separator": ",",
      "decimal_separator": "."
    },
    "timezone": "America/New_York",
    "locations": [
      {
        "id": 1,
        "name": "Main Store",
        "landmark": "Downtown",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "zip_code": "10001",
        "is_active": 1
      }
    ]
  }
}
```

## Products

### Get Products
```http
GET /products?page=1&per_page=500
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 25, max: 500)
- `location_id` (optional): Filter by location
- `category_id` (optional): Filter by category

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Product Name",
      "type": "single",
      "sku": "SKU001",
      "category": {
        "id": 1,
        "name": "Category Name"
      },
      "selling_price": 10.99,
      "product_variations": [
        {
          "id": 1,
          "name": "Default",
          "variations": [
            {
              "id": 1,
              "sell_price_inc_tax": "10.99",
              "variation_location_details": [
                {
                  "location_id": 1,
                  "qty_available": "100"
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  },
  "meta": {
    "current_page": 1,
    "per_page": 500,
    "total": 1250
  }
}
```

## Customers (Contacts)

### Get Contacts
```http
GET /contacts?type=customer&page=1&per_page=500
```

**Query Parameters:**
- `type`: "customer" or "supplier"
- `page` (optional): Page number
- `per_page` (optional): Items per page

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "type": "customer",
      "name": "John Doe",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "mobile": "+1234567890",
      "contact_id": "CO0001",
      "contact_status": "active",
      "address_line_1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "zip_code": "10001"
    }
  ]
}
```

### Create Contact
```http
POST /contacts
```

**Request Body:**
```json
{
  "type": "customer",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "mobile": "+1234567891",
  "address_line_1": "456 Oak Ave",
  "city": "Boston",
  "state": "MA",
  "country": "USA",
  "zip_code": "02101"
}
```

**Response:**
```json
{
  "data": {
    "id": 2,
    "contact_id": "CO0002",
    // ... other contact fields
  }
}
```

## Sales

### Create Sale
```http
POST /sell
```

**Request Body:**
```json
{
  "contact_id": 1,
  "location_id": 1,
  "transaction_date": "2025-06-23 14:30:00",
  "final_total": 150.00,
  "tax_amount": 0,
  "discount_amount": 0,
  "status": "final",
  "products": [
    {
      "product_id": 1,
      "variation_id": 1,
      "quantity": 2,
      "unit_price": 75.00
    }
  ],
  "payments": [
    {
      "amount": 150.00,
      "method": "cash"
    }
  ]
}
```

**Response:**
```json
[
  {
    "id": 12345,
    "business_id": 1,
    "location_id": 1,
    "contact_id": 1,
    "invoice_no": "2025-12345",
    "transaction_date": "2025-06-23 14:30:00",
    "final_total": 150.00,
    "invoice_url": "https://erp.sadiid.net/invoice/abc123",
    "payment_lines": [
      {
        "id": 1001,
        "amount": "150.00",
        "method": "cash",
        "paid_on": "2025-06-23 14:30:00"
      }
    ],
    "sell_lines": [
      {
        "id": 2001,
        "product_id": 1,
        "variation_id": 1,
        "quantity": 2,
        "unit_price": "75.00",
        "unit_price_inc_tax": "75.00"
      }
    ],
    "contact": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

### Get Sales
```http
GET /sell?page=1&per_page=50
```

**Query Parameters:**
- `page` (optional): Page number
- `per_page` (optional): Items per page
- `location_id` (optional): Filter by location
- `contact_id` (optional): Filter by customer
- `start_date` (optional): Filter by date range (YYYY-MM-DD)
- `end_date` (optional): Filter by date range (YYYY-MM-DD)

**Response:**
```json
{
  "data": [
    {
      "id": 12345,
      "invoice_no": "2025-12345",
      "contact": {
        "name": "John Doe"
      },
      "transaction_date": "2025-06-23 14:30:00",
      "final_total": "150.00",
      "payment_status": "paid"
    }
  ]
}
```

### Get Single Sale
```http
GET /sell/{id}
```

**Response:**
```json
{
  "data": [
    {
      "id": 12345,
      "invoice_no": "2025-12345",
      "transaction_date": "2025-06-23 14:30:00",
      "final_total": "150.00",
      "sell_lines": [
        // ... sale line items
      ],
      "payment_lines": [
        // ... payment details
      ],
      "contact": {
        // ... customer details
      },
      "invoice_url": "https://erp.sadiid.net/invoice/abc123"
    }
  ]
}
```

### Update Sale
```http
PUT /sell/{id}
PATCH /sell/{id}
```

**Request Body:** (Same structure as Create Sale)

## Categories (Taxonomy)

### Get Categories
```http
GET /taxonomy?type=product
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic products",
      "category_type": "product"
    }
  ]
}
```

## Attendance Management

### Get Attendance
```http
GET /get-attendance/{user_id}
```

### Clock In
```http
POST /clock-in
```

**Request Body:**
```json
{
  "user_id": 1,
  "clock_in_time": "2025-06-23 09:00:00",
  "clock_in_note": "Starting work",
  "ip_address": "192.168.1.100",
  "latitude": "40.7128",
  "longitude": "-74.0060"
}
```

### Clock Out
```http
POST /clock-out
```

**Request Body:**
```json
{
  "user_id": 1,
  "clock_out_time": "2025-06-23 17:00:00",
  "clock_out_note": "End of shift"
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

### Common HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (token invalid/expired)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **422**: Unprocessable Entity (validation failed)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

### Rate Limiting
- Most endpoints: 60 requests per minute
- Authentication: 5 requests per minute
- Heavy operations: 10 requests per minute

### Offline Handling
When offline, the application:
1. Stores operations in local IndexedDB queue
2. Processes queue when connection is restored
3. Handles conflicts with server-side data
4. Provides user feedback on sync status

## Data Types

### Common Field Types
- **ID fields**: Integer
- **Monetary values**: String (decimal with 4 decimal places)
- **Dates**: String in "YYYY-MM-DD HH:mm:ss" format
- **Boolean flags**: Integer (0 or 1)
- **Status fields**: String (predefined values)

### Business Rules
- All monetary calculations use 4 decimal places
- Dates are stored in business timezone
- Stock quantities are tracked per location
- Contact IDs follow format "CO####"
- Invoice numbers follow format "YYYY-#####"

---

*This documentation is updated to reflect the current API version. Contact the development team for any clarifications or updates.*
