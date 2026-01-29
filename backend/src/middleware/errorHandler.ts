/**
 * Centralized Error Handler Middleware
 * Converts errors to standardized API responses
 */

import { APIGatewayResponse } from '../interfaces/Controller';
import { AppError } from '../errors/AppError';
import { createResponse } from '../utils/response';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    correlationId: string;
    details?: Record<string, unknown>;
    stack?: string;
  };
}

export function handleError(
  error: Error | AppError,
  correlationId: string,
  includeStack: boolean = false
): APIGatewayResponse {
  // Log error details
  console.error('[Error Handler]', {
    correlationId,
    error: error.message,
    stack: error.stack,
    ...(error instanceof AppError && { code: error.code, statusCode: error.statusCode }),
  });

  // Handle known application errors
  if (error instanceof AppError) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        correlationId,
        // Only include details in debug mode (includeStack = true)
        // In production, details may contain sensitive information
        ...(includeStack && error.details && { details: error.details }),
        ...(includeStack && { stack: error.stack }),
      },
    };

    return createResponse(error.statusCode, errorResponse);
  }

  // Handle unknown errors
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: includeStack ? error.message : 'An unexpected error occurred',
      correlationId,
      ...(includeStack && { stack: error.stack }),
    },
  };

  return createResponse(500, errorResponse);
}

export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export function logError(error: Error, context?: Record<string, unknown>): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error instanceof AppError && {
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      details: error.details,
    }),
    ...context,
  };

  if (error instanceof AppError && error.isOperational) {
    console.warn('[Operational Error]', JSON.stringify(errorLog));
  } else {
    console.error('[Critical Error]', JSON.stringify(errorLog));
  }
}
