/**
 * Custom API Error Classes
 * Standardized error handling for API routes
 */

import { ApiErrorCode } from './types';

/**
 * Base API Error
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    message: string,
    code: ApiErrorCode = ApiErrorCode.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad Request', details?: any) {
    super(message, ApiErrorCode.BAD_REQUEST, 400, details);
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation Failed', details?: any) {
    super(message, ApiErrorCode.VALIDATION_ERROR, 400, details);
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, ApiErrorCode.UNAUTHORIZED, 401, details);
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, ApiErrorCode.FORBIDDEN, 403, details);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource Not Found', details?: any) {
    super(message, ApiErrorCode.NOT_FOUND, 404, details);
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource Conflict', details?: any) {
    super(message, ApiErrorCode.CONFLICT, 409, details);
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal Server Error', details?: any) {
    super(message, ApiErrorCode.INTERNAL_SERVER_ERROR, 500, details);
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message: string = 'Service Unavailable', details?: any) {
    super(message, ApiErrorCode.SERVICE_UNAVAILABLE, 503, details);
  }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database Error', details?: any) {
    super(message, ApiErrorCode.DATABASE_ERROR, 500, details);
  }
}

