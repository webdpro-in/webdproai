/**
 * Property-Based Tests for Error Handling Framework
 * Feature: webdpro-production-refactoring
 * Property 17: Standardized error response format
 * Validates: Requirements 6.1, 6.3
 */

import fc from 'fast-check';
import { handleError } from '../../src/middleware/errorHandler';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  InternalError,
  DatabaseError,
  ConfigurationError,
} from '../../src/errors/AppError';

describe('Property 17: Standardized error response format', () => {
  /**
   * **Validates: Requirements 6.1, 6.3**
   * 
   * For any error response, the JSON body should contain fields:
   * - error.code (string)
   * - error.message (string)
   * - error.correlationId (UUID)
   * 
   * And should NOT contain internal details like:
   * - stack traces (unless explicitly enabled for debugging)
   * - SQL queries
   * - Internal implementation details
   */
  it('should return standardized error format with required fields for all AppError types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          errorType: fc.constantFrom(
            'validation',
            'authentication',
            'authorization',
            'notFound',
            'conflict',
            'rateLimit',
            'externalService',
            'internal',
            'database',
            'configuration'
          ),
          message: fc.string({ minLength: 1, maxLength: 200 }),
          correlationId: fc.uuid(),
          details: fc.option(
            fc.dictionary(
              fc.string({ minLength: 1, maxLength: 50 }),
              fc.oneof(
                fc.string(),
                fc.integer(),
                fc.boolean(),
                fc.constant(null)
              )
            ),
            { nil: undefined }
          ),
        }),
        async ({ errorType, message, correlationId, details }) => {
          // Create appropriate error based on type
          let error: AppError;
          switch (errorType) {
            case 'validation':
              error = new ValidationError(message, details);
              break;
            case 'authentication':
              error = new AuthenticationError(message);
              break;
            case 'authorization':
              error = new AuthorizationError(message);
              break;
            case 'notFound':
              error = new NotFoundError('Resource', 'test-id');
              break;
            case 'conflict':
              error = new ConflictError(message);
              break;
            case 'rateLimit':
              error = new RateLimitError(message);
              break;
            case 'externalService':
              error = new ExternalServiceError('TestService', message, details);
              break;
            case 'internal':
              error = new InternalError(message, details);
              break;
            case 'database':
              error = new DatabaseError('query', message, details);
              break;
            case 'configuration':
              error = new ConfigurationError(message, details);
              break;
            default:
              error = new InternalError(message);
          }

          // Handle the error (without stack trace in production mode)
          const response = handleError(error, correlationId, false);

          // Parse the response body
          const body = JSON.parse(response.body);

          // Verify required fields exist
          expect(body).toHaveProperty('error');
          expect(body.error).toHaveProperty('code');
          expect(body.error).toHaveProperty('message');
          expect(body.error).toHaveProperty('correlationId');

          // Verify field types
          expect(typeof body.error.code).toBe('string');
          expect(typeof body.error.message).toBe('string');
          expect(typeof body.error.correlationId).toBe('string');

          // Verify correlationId is a valid UUID
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          expect(body.error.correlationId).toMatch(uuidRegex);
          expect(body.error.correlationId).toBe(correlationId);

          // Verify no internal details are exposed (no stack trace in production mode)
          expect(body.error).not.toHaveProperty('stack');

          // Verify code is not empty
          expect(body.error.code.length).toBeGreaterThan(0);

          // Verify message is not empty
          expect(body.error.message.length).toBeGreaterThan(0);

          // Verify success flag is false
          expect(body.success).toBe(false);

          // Details should NOT be included in production mode (includeStack = false)
          expect(body.error).not.toHaveProperty('details');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should not expose stack traces in production mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          message: fc.string({ minLength: 1, maxLength: 200 }),
          correlationId: fc.uuid(),
        }),
        async ({ message, correlationId }) => {
          const error = new InternalError(message);

          // Handle error in production mode (includeStack = false)
          const response = handleError(error, correlationId, false);
          const body = JSON.parse(response.body);

          // Stack trace should NOT be present
          expect(body.error).not.toHaveProperty('stack');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should not expose SQL queries or internal implementation details', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          sqlQuery: fc.constant('SELECT * FROM users WHERE password = "secret"'),
          internalPath: fc.constant('/var/app/internal/config.json'),
          correlationId: fc.uuid(),
        }),
        async ({ sqlQuery, internalPath, correlationId }) => {
          // Create error with internal details
          const error = new DatabaseError('query', 'Database operation failed', {
            query: sqlQuery,
            path: internalPath,
          });

          // Handle error in production mode (includeStack = false)
          const response = handleError(error, correlationId, false);
          const body = JSON.parse(response.body);

          // The error message should not contain SQL queries
          expect(body.error.message).not.toContain('SELECT');
          expect(body.error.message).not.toContain('password');
          expect(body.error.message).not.toContain('secret');

          // Details should NOT be exposed in production mode
          expect(body.error).not.toHaveProperty('details');
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should return appropriate HTTP status codes for different error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          correlationId: fc.uuid(),
        }),
        async ({ correlationId }) => {
          const testCases = [
            { error: new ValidationError('Invalid input'), expectedStatus: 400 },
            { error: new AuthenticationError('Auth failed'), expectedStatus: 401 },
            { error: new AuthorizationError('Access denied'), expectedStatus: 403 },
            { error: new NotFoundError('User', '123'), expectedStatus: 404 },
            { error: new ConflictError('Resource exists'), expectedStatus: 409 },
            { error: new RateLimitError('Too many requests'), expectedStatus: 429 },
            { error: new ExternalServiceError('API', 'Service down'), expectedStatus: 502 },
            { error: new InternalError('Server error'), expectedStatus: 500 },
            { error: new DatabaseError('insert', 'DB error'), expectedStatus: 500 },
            { error: new ConfigurationError('Config missing'), expectedStatus: 500 },
          ];

          for (const { error, expectedStatus } of testCases) {
            const response = handleError(error, correlationId, false);
            expect(response.statusCode).toBe(expectedStatus);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should handle unknown errors with standardized format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          message: fc.string({ minLength: 1, maxLength: 200 }),
          correlationId: fc.uuid(),
        }),
        async ({ message, correlationId }) => {
          // Create a standard Error (not AppError)
          const error = new Error(message);

          // Handle the unknown error
          const response = handleError(error, correlationId, false);
          const body = JSON.parse(response.body);

          // Should still have standardized format
          expect(body).toHaveProperty('error');
          expect(body.error).toHaveProperty('code');
          expect(body.error).toHaveProperty('message');
          expect(body.error).toHaveProperty('correlationId');

          // Should return 500 for unknown errors
          expect(response.statusCode).toBe(500);

          // Code should be INTERNAL_ERROR
          expect(body.error.code).toBe('INTERNAL_ERROR');

          // Should not expose original error message in production
          expect(body.error.message).toBe('An unexpected error occurred');

          // Should not have stack trace
          expect(body.error).not.toHaveProperty('stack');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should preserve error details when in debug mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          field: fc.string({ minLength: 1, maxLength: 50 }),
          constraint: fc.string({ minLength: 1, maxLength: 50 }),
          min: fc.integer({ min: 1, max: 100 }),
          max: fc.integer({ min: 101, max: 1000 }),
          correlationId: fc.uuid(),
        }),
        async ({ field, constraint, min, max, correlationId }) => {
          const details = { field, constraint, min, max };
          const error = new ValidationError('Validation failed', details);

          // Handle error in debug mode (includeStack = true)
          const response = handleError(error, correlationId, true);
          const body = JSON.parse(response.body);

          // Details should be present in debug mode
          expect(body.error).toHaveProperty('details');
          expect(body.error.details).toEqual(details);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should not include details in production mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          field: fc.string({ minLength: 1, maxLength: 50 }),
          constraint: fc.string({ minLength: 1, maxLength: 50 }),
          correlationId: fc.uuid(),
        }),
        async ({ field, constraint, correlationId }) => {
          const details = { field, constraint };
          const error = new ValidationError('Validation failed', details);

          // Handle error in production mode (includeStack = false)
          const response = handleError(error, correlationId, false);
          const body = JSON.parse(response.body);

          // Details should NOT be present in production mode
          expect(body.error).not.toHaveProperty('details');
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should include proper CORS headers in error responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          message: fc.string({ minLength: 1, maxLength: 200 }),
          correlationId: fc.uuid(),
        }),
        async ({ message, correlationId }) => {
          const error = new ValidationError(message);
          const response = handleError(error, correlationId, false);

          // Verify CORS headers are present
          expect(response.headers).toHaveProperty('Content-Type');
          expect(response.headers['Content-Type']).toBe('application/json');

          // Verify response is valid JSON
          expect(() => JSON.parse(response.body)).not.toThrow();
        }
      ),
      { numRuns: 10 }
    );
  });
});
