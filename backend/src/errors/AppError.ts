/**
 * Application Error Hierarchy
 * Standardized error types for consistent error handling
 */

export abstract class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly isOperational: boolean = true,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super('AUTHENTICATION_ERROR', message, 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super('AUTHORIZATION_ERROR', message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super('NOT_FOUND', message, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super('RATE_LIMIT_EXCEEDED', message, 429, true);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: Record<string, unknown>) {
    super('EXTERNAL_SERVICE_ERROR', `${service}: ${message}`, 502, true, details);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', details?: Record<string, unknown>) {
    super('INTERNAL_ERROR', message, 500, false, details);
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, message: string, details?: Record<string, unknown>) {
    super('DATABASE_ERROR', `Database ${operation} failed: ${message}`, 500, false, details);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFIGURATION_ERROR', message, 500, false, details);
  }
}
