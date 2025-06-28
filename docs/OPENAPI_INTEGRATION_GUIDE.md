# OpenAPI Integration Guide

This guide explains how to use the Sadiid ERP OpenAPI specification (`docs/openapi.yaml`) to enhance development, testing, and documentation workflows.

## Overview

The OpenAPI specification provides:
- **81 API endpoints** organized by functional areas
- **Comprehensive request/response schemas** with validation rules
- **Authentication and security requirements**
- **Interactive documentation** capabilities
- **Code generation** possibilities

## Quick Start

### 1. View Interactive Documentation

**Option A: Swagger UI Online**
1. Go to [Swagger Editor](https://editor.swagger.io/)
2. Upload or paste the contents of `docs/openapi.yaml`
3. Explore the interactive documentation

**Option B: Local Swagger UI**
```bash
# Install swagger-ui-serve globally
npm install -g swagger-ui-serve

# Serve the documentation locally
swagger-ui-serve docs/openapi.yaml
```

**Option C: VS Code Extension**
1. Install "OpenAPI (Swagger) Editor" extension
2. Open `docs/openapi.yaml` in VS Code
3. Use Command Palette: "OpenAPI: Preview"

### 2. Generate TypeScript Types

The project already includes comprehensive TypeScript types in `src/types/api.ts`, but you can also generate types directly from the OpenAPI spec:

```bash
# Install openapi-typescript
npm install -D openapi-typescript

# Generate types
npx openapi-typescript docs/openapi.yaml --output src/types/generated-api.ts
```

### 3. Validate API Requests

Use the OpenAPI spec to validate API requests and responses:

```bash
# Install swagger-parser
npm install swagger-parser

# Validate the spec
npx swagger-parser validate docs/openapi.yaml
```

## API Endpoint Categories

The OpenAPI spec organizes endpoints into these categories:

### 🔐 Authentication (8 endpoints)
- OAuth2 token management
- User registration and login
- Password management

### 🏢 Business Management (7 endpoints)
- Business details and settings
- Location management
- Subscription and package info

### 📦 Product Management (12 endpoints)
- Product catalog CRUD
- Variations and inventory
- Categories, brands, units
- Stock reporting

### 💰 Sales & POS (15 endpoints)
- Transaction processing
- Payment handling
- Returns and refunds
- Cash register management

### 👥 Customer Management (8 endpoints)
- Contact/customer CRUD
- CRM features
- Follow-ups and leads

### 💸 Expense Management (4 endpoints)
- Expense tracking
- Categories and refunds

### 📊 Reporting (2 endpoints)
- Profit/loss reports
- Stock reports

### 👨‍💼 Field Force Management (3 endpoints)
- Visit tracking
- Status updates

### ⚙️ System Administration (15 endpoints)
- User management
- System settings
- Attendance tracking

### 🔌 System Integration (7 endpoints)
- API client management
- System connectors

## Development Workflows

### API Client Generation

Generate a fully-typed API client:

```bash
# Install @openapitools/openapi-generator-cli
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g typescript-axios \
  -o src/lib/api-client
```

### Mock Server for Development

Create a mock server for development and testing:

```bash
# Install prism
npm install -g @stoplight/prism-cli

# Start mock server
prism mock docs/openapi.yaml --port 3001
```

### API Testing with Postman

1. **Import OpenAPI Spec to Postman:**
   - Open Postman
   - File → Import → Select `docs/openapi.yaml`
   - Choose "Generate collection from specification"

2. **Use Existing Collection:**
   - Import `Sadiid_POS_API.postman_collection.json`
   - This collection is already enriched with real examples

### Request Validation

Validate requests before sending them:

```typescript
import { validateApiRequest } from './lib/api-validator';

// Example usage
const requestData = {
  name: "Test Product",
  type: "single",
  unit_id: 1
};

const isValid = await validateApiRequest(
  'POST',
  '/connector/api/product',
  requestData
);
```

### Response Type Safety

Use generated types for full type safety:

```typescript
import { Product, ApiResponse } from './types/api';

// Fully typed API response
const response: ApiResponse<Product> = await api.getProduct(123);

// TypeScript will enforce correct property access
console.log(response.data.name); // ✅ Type-safe
console.log(response.data.invalid); // ❌ TypeScript error
```

## Testing Integration

### Automated API Testing

Use the OpenAPI spec for comprehensive API testing:

```javascript
// Example Jest test with OpenAPI validation
import { validateResponse } from 'openapi-response-validator';

test('GET /connector/api/product returns valid response', async () => {
  const response = await api.getProducts();
  
  // Validate against OpenAPI spec
  const validator = validateResponse({
    responses: spec.paths['/connector/api/product'].get.responses
  });
  
  expect(validator(response)).toBeUndefined(); // No validation errors
});
```

### Contract Testing

Ensure frontend and backend stay in sync:

```bash
# Install pact for contract testing
npm install --save-dev @pact-foundation/pact

# Generate Pact contracts from OpenAPI spec
npx swagger2pact docs/openapi.yaml --output tests/contracts/
```

## Documentation Integration

### Update README References

The README.md now includes comprehensive references to the OpenAPI documentation:

- **Interactive Documentation**: Links to Swagger UI
- **API Reference**: Points to `API_DOCUMENTATION.md` and OpenAPI spec
- **Type Definitions**: References `src/types/api.ts`

### Synchronization

Keep documentation in sync:

1. **OpenAPI spec** (`docs/openapi.yaml`) - Source of truth
2. **API Documentation** (`API_DOCUMENTATION.md`) - Human-readable format
3. **Postman Collection** (`Sadiid_POS_API.postman_collection.json`) - Interactive testing
4. **TypeScript Types** (`src/types/api.ts`) - Development integration

## Best Practices

### 1. Version Control
- Keep the OpenAPI spec in version control
- Tag releases when API changes
- Use semantic versioning for API versions

### 2. Validation
- Validate all API requests/responses against the spec
- Use automated testing to catch breaking changes
- Implement spec-driven development

### 3. Documentation
- Keep the OpenAPI spec up-to-date with backend changes
- Generate documentation automatically from the spec
- Use examples and descriptions liberally

### 4. Development
- Generate types and clients from the spec
- Use mock servers for frontend development
- Implement contract testing between frontend and backend

## Troubleshooting

### Common Issues

1. **CORS Issues with Swagger UI:**
   ```bash
   # Add CORS headers to your local server
   # Or use swagger-ui-serve with --cors flag
   swagger-ui-serve docs/openapi.yaml --cors
   ```

2. **Validation Errors:**
   ```bash
   # Check spec validity
   npx swagger-parser validate docs/openapi.yaml
   
   # Fix common issues
   # - Missing required fields
   # - Invalid schema references
   # - Incorrect response formats
   ```

3. **Type Generation Issues:**
   ```bash
   # Clear generated files and regenerate
   rm -rf src/types/generated-api.ts
   npx openapi-typescript docs/openapi.yaml --output src/types/generated-api.ts
   ```

## Integration Checklist

- [ ] OpenAPI spec copied to `docs/openapi.yaml`
- [ ] TypeScript types created in `src/types/api.ts`
- [ ] Documentation updated to reference OpenAPI spec
- [ ] Swagger UI setup for interactive documentation
- [ ] API client generation configured
- [ ] Mock server setup for development
- [ ] Validation tools integrated
- [ ] Testing workflows updated
- [ ] CI/CD pipeline includes spec validation

## Next Steps

1. **Enhance the OpenAPI spec** with more detailed examples and descriptions
2. **Set up automated spec validation** in CI/CD pipeline
3. **Implement spec-driven development** workflow
4. **Add contract testing** between frontend and backend
5. **Create automated documentation** generation
6. **Set up API monitoring** based on the spec

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Tools](https://swagger.io/tools/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Stoplight Prism](https://stoplight.io/open-source/prism)
- [OpenAPI TypeScript](https://github.com/drwpow/openapi-typescript)

---

*This guide is part of the Sadiid Offline POS project documentation. For more information, see the [main README](../README.md) and [API Documentation](../API_DOCUMENTATION.md).*
