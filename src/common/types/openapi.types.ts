/**
 * OpenAPI 3.0 Schema 정의
 * https://swagger.io/specification/
 */
export interface OpenAPISchema {
  // Basic types
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

  // String validations
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;

  // Number validations
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;

  // Array validations
  items?: OpenAPISchema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  // Object validations
  properties?: Record<string, OpenAPISchema>;
  required?: string[];
  additionalProperties?: boolean | OpenAPISchema;

  // Enums and constants
  enum?: unknown[];
  const?: unknown;

  // Composition
  allOf?: OpenAPISchema[];
  oneOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  not?: OpenAPISchema;

  // Metadata
  title?: string;
  description?: string;
  default?: unknown;
  example?: unknown;
  deprecated?: boolean;

  // Nullable support
  nullable?: boolean;

  // Reference
  $ref?: string;
}
