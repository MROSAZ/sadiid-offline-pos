#!/usr/bin/env node

/**
 * OpenAPI Type Generator Script
 * 
 * This script generates TypeScript types from the OpenAPI specification
 * and validates the API client against the spec.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OPENAPI_FILE = path.join(__dirname, '../docs/openapi.yaml');
const OUTPUT_DIR = path.join(__dirname, '../src/types');
const GENERATED_TYPES_FILE = path.join(OUTPUT_DIR, 'generated-api.ts');

/**
 * Load and parse the OpenAPI specification
 */
function loadOpenAPISpec() {
  try {
    const fileContents = fs.readFileSync(OPENAPI_FILE, 'utf8');
    return yaml.load(fileContents);
  } catch (error) {
    console.error('❌ Failed to load OpenAPI spec:', error.message);
    process.exit(1);
  }
}

/**
 * Convert OpenAPI type to TypeScript type
 */
function convertOpenAPIType(schema) {
  if (!schema) return 'any';
  
  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        return schema.enum.map(v => `'${v}'`).join(' | ');
      }
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      const itemType = convertOpenAPIType(schema.items);
      return `${itemType}[]`;
    case 'object':
      if (schema.properties) {
        const props = Object.entries(schema.properties).map(([key, prop]) => {
          const isRequired = schema.required && schema.required.includes(key);
          const propType = convertOpenAPIType(prop);
          return `  ${key}${isRequired ? '' : '?'}: ${propType};`;
        });
        return `{\n${props.join('\n')}\n}`;
      }
      return 'Record<string, any>';
    default:
      return 'any';
  }
}

/**
 * Generate TypeScript interfaces from OpenAPI components
 */
function generateInterfaces(spec) {
  let interfaces = [];
  
  if (spec.components && spec.components.schemas) {
    Object.entries(spec.components.schemas).forEach(([name, schema]) => {
      const interfaceName = name.charAt(0).toUpperCase() + name.slice(1);
      const interfaceType = convertOpenAPIType(schema);
      
      interfaces.push(`export interface ${interfaceName} ${interfaceType}`);
    });
  }
  
  return interfaces.join('\n\n');
}

/**
 * Generate endpoint types from paths
 */
function generateEndpointTypes(spec) {
  let endpoints = [];
  
  if (spec.paths) {
    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          const operationId = operation.operationId || 
            `${method}${path.split('/').filter(Boolean).map(s => 
              s.charAt(0).toUpperCase() + s.slice(1).replace(/[{}]/g, '')
            ).join('')}`;
          
          // Generate request type
          let requestType = 'void';
          if (operation.requestBody) {
            const content = operation.requestBody.content;
            if (content['application/json']) {
              requestType = convertOpenAPIType(content['application/json'].schema);
            } else if (content['multipart/form-data']) {
              requestType = 'FormData';
            }
          }
          
          // Generate response type
          let responseType = 'any';
          if (operation.responses && operation.responses['200']) {
            const response = operation.responses['200'];
            if (response.content && response.content['application/json']) {
              responseType = convertOpenAPIType(response.content['application/json'].schema);
            }
          }
          
          // Generate parameter types
          let parameterTypes = [];
          if (operation.parameters) {
            operation.parameters.forEach(param => {
              const paramType = convertOpenAPIType(param.schema);
              parameterTypes.push(`${param.name}${param.required ? '' : '?'}: ${paramType}`);
            });
          }
          
          const hasParams = parameterTypes.length > 0;
          const hasBody = requestType !== 'void';
          
          let methodSignature = `${operationId}(`;
          if (hasParams) {
            methodSignature += `params: { ${parameterTypes.join('; ')} }`;
            if (hasBody) methodSignature += ', ';
          }
          if (hasBody) {
            methodSignature += `data: ${requestType}`;
          }
          methodSignature += `): Promise<ApiResponse<${responseType}>>`;
          
          endpoints.push(`  /** ${operation.summary || operation.description || path} */`);
          endpoints.push(`  ${methodSignature};`);
        }
      });
    });
  }
  
  return endpoints.join('\n');
}

/**
 * Generate the complete TypeScript file
 */
function generateTypesFile(spec) {
  const header = `/**
 * Generated TypeScript types from OpenAPI specification
 * 
 * This file is auto-generated from docs/openapi.yaml
 * Do not edit manually - regenerate using npm run generate-types
 * 
 * Generated on: ${new Date().toISOString()}
 * OpenAPI Version: ${spec.openapi}
 * API Title: ${spec.info.title}
 * API Version: ${spec.info.version}
 */

// Base types
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
`;

  const interfaces = generateInterfaces(spec);
  const endpoints = generateEndpointTypes(spec);
  
  const endpointInterface = `
// API Endpoints Interface
export interface GeneratedApiEndpoints {
${endpoints}
}`;

  const footer = `
// Export endpoint paths for reference
export const API_PATHS = ${JSON.stringify(Object.keys(spec.paths || {}), null, 2)};

// Export OpenAPI spec metadata
export const API_INFO = ${JSON.stringify(spec.info, null, 2)};

// Export server configuration
export const API_SERVERS = ${JSON.stringify(spec.servers, null, 2)};
`;

  return [header, interfaces, endpointInterface, footer].filter(Boolean).join('\n');
}

/**
 * Validate existing API client against OpenAPI spec
 */
function validateApiClient(spec) {
  const apiClientPath = path.join(__dirname, '../lib/api-client.ts');
  
  if (!fs.existsSync(apiClientPath)) {
    console.warn('⚠️  API client file not found for validation');
    return;
  }
  
  const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
  const specPaths = Object.keys(spec.paths || {});
  
  console.log('\n📊 API Client Validation:');
  console.log(`   OpenAPI spec defines ${specPaths.length} endpoints`);
  
  // Check for missing endpoints (basic validation)
  const missingEndpoints = specPaths.filter(path => 
    !apiClientContent.includes(path.replace('/connector/api/', ''))
  );
  
  if (missingEndpoints.length > 0) {
    console.log(`   ⚠️  ${missingEndpoints.length} endpoints not found in API client:`);
    missingEndpoints.slice(0, 5).forEach(endpoint => {
      console.log(`      - ${endpoint}`);
    });
    if (missingEndpoints.length > 5) {
      console.log(`      ... and ${missingEndpoints.length - 5} more`);
    }
  } else {
    console.log('   ✅ All main endpoints appear to be covered');
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔄 Generating TypeScript types from OpenAPI specification...');
  
  // Load OpenAPI spec
  const spec = loadOpenAPISpec();
  console.log(`📖 Loaded OpenAPI spec: ${spec.info.title} v${spec.info.version}`);
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Generate types file
  const typesContent = generateTypesFile(spec);
  fs.writeFileSync(GENERATED_TYPES_FILE, typesContent, 'utf8');
  console.log(`✅ Generated types file: ${GENERATED_TYPES_FILE}`);
  
  // Validate API client
  validateApiClient(spec);
  
  // Summary
  const pathCount = Object.keys(spec.paths || {}).length;
  const schemaCount = Object.keys(spec.components?.schemas || {}).length;
  
  console.log('\n📈 Generation Summary:');
  console.log(`   📍 API Endpoints: ${pathCount}`);
  console.log(`   🏗️  Schema Components: ${schemaCount}`);
  console.log(`   📁 Output File: ${path.relative(process.cwd(), GENERATED_TYPES_FILE)}`);
  console.log('\n✨ Type generation complete!');
  
  // Usage instructions
  console.log('\n📚 Usage:');
  console.log('   Import types: import { GeneratedApiEndpoints } from "./types/generated-api"');
  console.log('   Use with client: const client: GeneratedApiEndpoints = apiClient;');
  console.log('   Validate spec: npm run validate-openapi');
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  main();
}

export {
  loadOpenAPISpec,
  generateTypesFile,
  validateApiClient,
  main
};
