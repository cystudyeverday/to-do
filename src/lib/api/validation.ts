/**
 * Request Validation Utilities
 * Validate and sanitize incoming requests
 */

import { ValidationError } from './errors';
import { ValidationErrorDetail } from './types';

/**
 * Validation Rule
 */
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

/**
 * Validation Schema
 */
export type ValidationSchema = Record<string, ValidationRule>;

/**
 * Validate data against schema
 */
export function validate(
  data: any,
  schema: ValidationSchema
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = [];

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`,
        value,
      });
      continue;
    }

    // Skip validation if field is not required and empty
    if (!rule.required && (value === undefined || value === null)) {
      continue;
    }

    // Type check
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors.push({
          field,
          message: `${field} must be of type ${rule.type}`,
          value,
        });
        continue;
      }
    }

    // String validations
    if (rule.type === 'string' || typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rule.minLength} characters`,
          value,
        });
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          field,
          message: `${field} must be at most ${rule.maxLength} characters`,
          value,
        });
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field,
          message: `${field} format is invalid`,
          value,
        });
      }
    }

    // Number validations
    if (rule.type === 'number' || typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field,
          message: `${field} must be at least ${rule.min}`,
          value,
        });
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field,
          message: `${field} must be at most ${rule.max}`,
          value,
        });
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field,
        message: `${field} must be one of: ${rule.enum.join(', ')}`,
        value,
      });
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        errors.push({
          field,
          message: typeof result === 'string' ? result : `${field} is invalid`,
          value,
        });
      }
    }
  }

  return errors;
}

/**
 * Validate request body
 */
export function validateRequestBody(
  body: any,
  schema: ValidationSchema
): void {
  const errors = validate(body, schema);

  if (errors.length > 0) {
    throw new ValidationError('Request validation failed', errors);
  }
}

/**
 * Parse and validate integer parameter
 */
export function parseIntParam(
  value: string | undefined,
  paramName: string
): number {
  if (!value) {
    throw new ValidationError(`${paramName} is required`);
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    throw new ValidationError(`${paramName} must be a valid integer`);
  }

  return parsed;
}

/**
 * Parse query parameters
 */
export function parseQueryParams(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10))
  );
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  return { page, pageSize, sortBy, sortOrder };
}

