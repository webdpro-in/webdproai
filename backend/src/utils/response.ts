/**
 * HTTP Response Utilities
 * Standardized response formatting for API Gateway
 */

import { APIGatewayResponse } from '../interfaces/Controller';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Request-ID',
  'Access-Control-Allow-Credentials': 'true',
};

export function createResponse(
  statusCode: number,
  body: unknown,
  additionalHeaders: Record<string, string> = {}
): APIGatewayResponse {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      ...additionalHeaders,
    },
    body: JSON.stringify(body),
  };
}

export function successResponse(data: unknown, statusCode: number = 200): APIGatewayResponse {
  return createResponse(statusCode, {
    success: true,
    data,
  });
}

export function errorResponse(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: Record<string, unknown>
): APIGatewayResponse {
  const errorBody: any = {
    success: false,
    error: {
      code: code || `ERROR_${statusCode}`,
      message,
    },
  };
  
  if (details) {
    errorBody.error.details = details;
  }
  
  return createResponse(statusCode, errorBody);
}

export function validationErrorResponse(
  message: string,
  details?: Record<string, unknown>
): APIGatewayResponse {
  return errorResponse(message, 400, 'VALIDATION_ERROR', details);
}

export function unauthorizedResponse(message: string = 'Unauthorized'): APIGatewayResponse {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

export function forbiddenResponse(message: string = 'Forbidden'): APIGatewayResponse {
  return errorResponse(message, 403, 'FORBIDDEN');
}

export function notFoundResponse(resource: string, id?: string): APIGatewayResponse {
  const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
  return errorResponse(message, 404, 'NOT_FOUND');
}

export function conflictResponse(message: string): APIGatewayResponse {
  return errorResponse(message, 409, 'CONFLICT');
}

export function internalErrorResponse(
  message: string = 'Internal server error',
  details?: Record<string, unknown>
): APIGatewayResponse {
  return errorResponse(message, 500, 'INTERNAL_ERROR', details);
}
