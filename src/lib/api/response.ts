/**
 * API Response Utilities
 * Standardized response formatting and error handling
 */

import { NextResponse } from 'next/server';
import { ApiResponse, ApiErrorResponse, ResponseMeta } from './types';
import { ApiError } from './errors';

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  meta?: Partial<ResponseMeta>
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return NextResponse.json(response, { status });
}

/**
 * Create an error response
 */
export function errorResponse(
  error: Error | ApiError,
  status?: number
): NextResponse<ApiResponse> {
  const isDevelopment = process.env.NODE_ENV === 'development';

  let apiError: ApiErrorResponse;
  let statusCode: number;

  if (error instanceof ApiError) {
    // Custom API Error
    apiError = {
      code: error.code,
      message: error.message,
      details: error.details,
      ...(isDevelopment && { stack: error.stack }),
    };
    statusCode = error.statusCode;
  } else {
    // Generic Error
    apiError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      ...(isDevelopment && { stack: error.stack }),
    };
    statusCode = status || 500;
  }

  const response: ApiResponse = {
    success: false,
    error: apiError,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  // Log error for monitoring
  console.error('[API Error]', {
    code: apiError.code,
    message: apiError.message,
    details: apiError.details,
    stack: error.stack,
  });

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
  status: number = 200
): NextResponse<ApiResponse<T[]>> {
  return successResponse(
    data,
    status,
    {
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  );
}

/**
 * Create a created response (201)
 */
export function createdResponse<T>(
  data: T,
  meta?: Partial<ResponseMeta>
): NextResponse<ApiResponse<T>> {
  return successResponse(data, 201, meta);
}

/**
 * Create a no content response (204)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Async error handler wrapper for API routes
 * Usage: export const GET = asyncHandler(async (req) => { ... })
 */
export function asyncHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse<any>>
): (...args: T) => Promise<NextResponse<any>> {
  return async (...args: T): Promise<NextResponse<any>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error as Error) as any;
    }
  };
}

