# 🏪 Sadiid Offline POS - Complete API Documentation

## Overview

This document provides comprehensive API documentation for the Sadiid Offline POS application, enriched with the complete Sadiid ERP backend API endpoints.

## Base URL
```
https://erp.sadiid.net/connector/api
```

## Authentication

### OAuth 2.0 Token Authentication
All endpoints require Bearer token authentication using OAuth 2.0.

#### Login
```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&username=USERNAME&password=PASSWORD&scope=*
```

**Success Response (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 31536000,
  "refresh_token": "def50200..."
}
```

**Error Response (401):**
```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed",
  "message": "Client authentication failed"
}
```

#### Headers for Authenticated Requests
```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

---

## 👤 User Management

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

---

## 🏢 Business Configuration

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

---

## 📦 Product Management

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
  "meta": {
    "current_page": 1,
    "per_page": 500,
    "total": 1250
  }
}
```

### Get Single Product
```http
GET /products/{id}
```

---

## 👥 Customer Management

### Get Customers
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

### Create Customer
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

### Update Customer
```http
PUT /contacts/{id}
```

### Get Single Customer
```http
GET /contacts/{id}
```

---

## 💰 Sales Management

### Create Sale
```http
POST /sell
```

**Request Body:**
```json
{
  "contact_id": 1,
  "location_id": 1,
  "transaction_date": "2025-06-28 14:30:00",
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
    "transaction_date": "2025-06-28 14:30:00",
    "final_total": 150.00,
    "invoice_url": "https://erp.sadiid.net/invoice/12345"
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

### Get Single Sale
```http
GET /sell/{id}
```

### Update Sale
```http
PUT /sell/{id}
PATCH /sell/{id}
```

### Delete Sale
```http
DELETE /sell/{id}
```

---

## ⏰ Attendance Management

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
  "clock_in_time": "2025-06-28 09:00:00",
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
  "clock_out_time": "2025-06-28 17:00:00",
  "clock_out_note": "End of shift"
}
```

---

## 🏷️ Brand Management

### List Brands
```http
GET /brands
```

### Get Brand Details
```http
GET /brands/{id}
```

---

## 🏢 Business Location Management

### List Business Locations
```http
GET /business-location
```

### Get Business Location
```http
GET /business-location/{id}
```

---

## 💼 CRM (Customer Relationship Management)

### List Follow-ups
```http
GET /crm/follow-ups
```

### Add Follow-up
```http
POST /crm/follow-ups
```

**Request Body:**
```json
{
  "title": "Meeting with client",
  "contact_id": 2,
  "description": "Follow-up meeting discussion",
  "schedule_type": "meeting",
  "user_id": [2, 3, 5],
  "notify_before": 5,
  "notify_type": "minute",
  "status": "open",
  "start_datetime": "2025-06-28 13:05:00",
  "end_datetime": "2025-06-28 14:05:00",
  "allow_notification": true
}
```

### Get Follow-up
```http
GET /crm/follow-ups/{id}
```

### Update Follow-up
```http
PUT /crm/follow-ups/{id}
```

### List Leads
```http
GET /crm/leads
```

---

## 💰 Cash Register Management

### List Cash Registers
```http
GET /cash-register
```

### Create Cash Register
```http
POST /cash-register
```

**Request Body:**
```json
{
  "location_id": 1,
  "initial_amount": 100.00,
  "created_at": "2025-06-28 09:00:00",
  "status": "open"
}
```

### Get Cash Register
```http
GET /cash-register/{id}
```

---

## 💸 Expense Management

### List Expenses
```http
GET /expense
```

### Create Expense
```http
POST /expense
```

**Request Body:**
```json
{
  "location_id": 1,
  "expense_category_id": 1,
  "ref_no": "EXP001",
  "transaction_date": "2025-06-28",
  "total_before_tax": 100.00,
  "tax_amount": 10.00,
  "final_total": 110.00,
  "payment_status": "paid",
  "expense_for": "1"
}
```

### Get Expense
```http
GET /expense/{id}
```

### Update Expense
```http
PUT /expense/{id}
```

### List Expense Categories
```http
GET /expense-categories
```

---

## 💱 Tax Management

### List Taxes
```http
GET /tax
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "VAT",
      "amount": 10.00,
      "is_tax_group": 0
    }
  ]
}
```

### Get Tax
```http
GET /tax/{id}
```

---

## 📏 Unit Management

### List Units
```http
GET /unit
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "actual_name": "Pieces",
      "short_name": "Pc",
      "allow_decimal": 0
    }
  ]
}
```

### Get Unit
```http
GET /unit/{id}
```

---

## 📂 Taxonomy Management

### List Categories
```http
GET /taxonomy?type=product
```

**Query Parameters:**
- `type`: Type of taxonomy (product, customer_group, etc.)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "parent_id": 0,
      "category_type": "product"
    }
  ]
}
```

### Get Category
```http
GET /taxonomy/{id}
```

---

## 🍽️ Table Management

### List Tables
```http
GET /table
```

### Get Table
```http
GET /table/{id}
```

---

## 🚶 Field Force Management

### List Visits
```http
GET /field-force/visits
```

### Create Visit
```http
POST /field-force/visits
```

**Request Body:**
```json
{
  "contact_id": 1,
  "visited_on": "2025-06-28 14:30:00",
  "visit_to": "customer",
  "meet_with": "Manager",
  "latitude": "40.7128",
  "longitude": "-74.0060",
  "comments": "Visited customer for product demo"
}
```

### Update Visit Status
```http
PUT /field-force/visits/{id}
```

---

## 📊 Reports & Analytics

### Get Profit & Loss Report
```http
GET /profit-loss-report?start_date=2025-06-01&end_date=2025-06-30&location_id=1
```

**Query Parameters:**
- `start_date`: Report start date (YYYY-MM-DD)
- `end_date`: Report end date (YYYY-MM-DD)
- `location_id`: Business location ID

### Get Product Stock
```http
GET /product-stock?location_id=1
```

**Query Parameters:**
- `location_id`: Business location ID

---

## 🔧 System & Utilities

### Get Notifications
```http
GET /notifications
```

### Get Location from Coordinates
```http
GET /get-location?lat=40.7128&lng=-74.0060
```

**Query Parameters:**
- `lat`: Latitude
- `lng`: Longitude

### List Payment Accounts
```http
GET /payment-account
```

### List Payment Methods
```http
GET /payment-methods
```

---

## 🚨 Error Handling

The API uses standard HTTP status codes and returns consistent error responses:

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Invalid or missing authentication |
| 403 | Forbidden | Access denied to resource |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Format

**Authentication Error (401):**
```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed",
  "message": "Client authentication failed"
}
```

**Validation Error (422):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": [
      "This field is required."
    ]
  }
}
```

**Not Found Error (404):**
```json
{
  "message": "Resource not found"
}
```

### Rate Limiting

The API implements rate limiting with the following headers in responses:

```http
X-Ratelimit-Limit: 60
X-Ratelimit-Remaining: 59
```

- **Authentication endpoints**: 5 requests/minute
- **Standard endpoints**: 60 requests/minute  
- **Heavy operations**: 10 requests/minute

---

## Testing with Postman

### Environment Setup
Create a Postman environment with these variables:
- `baseUrl`: https://erp.sadiid.net/connector/api
- `authUrl`: https://erp.sadiid.net/oauth/token
- `accessToken`: (will be set automatically after login)
- `username`: your_username
- `password`: your_password
- `clientId`: your_client_id
- `clientSecret`: your_client_secret

### Import Collection
Import the `Sadiid_POS_API.postman_collection.json` file into Postman for complete API testing capabilities.

---

*Last Updated: June 28, 2025*
*API Version: 1.0.0*
*Status: Production Ready*
