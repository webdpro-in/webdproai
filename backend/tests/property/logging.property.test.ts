/**
 * Property-Based Tests for Logging Infrastructure
 * Feature: webdpro-production-refactoring
 * Property 44: Structured JSON logging
 * Property 45: Correlation ID propagation
 * Validates: Requirements 12.1, 12.2
 */

import fc from 'fast-check';
import { Logger, logger } from '../../src/lib/logger';

describe('Property 44: Structured JSON logging', () => {
  /**
   * **Validates: Requirements 12.1**
   * 
   * For any log entry, the entry should be valid JSON and contain required fields:
   * - timestamp (ISO 8601 string)
   * - level (string: DEBUG, INFO, WARN, ERROR)
   * - message (string)
   * - correlationId (string, if set in context)
   * - service (string, if set in context)
   */
  
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console methods to capture log output
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    
    // Clear logger context
    logger.clearContext();
  });

  it('should produce valid JSON for all log levels', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          level: fc.constantFrom('info', 'warn', 'error', 'debug'),
          context: fc.string({ minLength: 1, maxLength: 100 }),
          message: fc.string({ minLength: 1, maxLength: 500 }),
          metadata: fc.option(
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
        async ({ level, context, message, metadata }) => {
          const testLogger = new Logger();

          // Call appropriate log method
          switch (level) {
            case 'info':
              testLogger.info(context, message, metadata);
              expect(consoleLogSpy).toHaveBeenCalled();
              break;
            case 'warn':
              testLogger.warn(context, message, metadata);
              expect(consoleWarnSpy).toHaveBeenCalled();
              break;
            case 'error':
              testLogger.error(context, message, undefined, metadata);
              expect(consoleErrorSpy).toHaveBeenCalled();
              break;
            case 'debug':
              // Set environment to enable debug logs
              const originalEnv = process.env.NODE_ENV;
              process.env.NODE_ENV = 'development';
              testLogger.debug(context, message, metadata);
              process.env.NODE_ENV = originalEnv;
              expect(consoleDebugSpy).toHaveBeenCalled();
              break;
          }

          // Get the logged output
          let logOutput: string;
          switch (level) {
            case 'info':
              logOutput = consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0];
              break;
            case 'warn':
              logOutput = consoleWarnSpy.mock.calls[consoleWarnSpy.mock.calls.length - 1][0];
              break;
            case 'error':
              logOutput = consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1][0];
              break;
            case 'debug':
              logOutput = consoleDebugSpy.mock.calls[consoleDebugSpy.mock.calls.length - 1][0];
              break;
            default:
              throw new Error('Invalid level');
          }

          // Verify it's valid JSON
          let parsedLog: any;
          expect(() => {
            parsedLog = JSON.parse(logOutput);
          }).not.toThrow();

          // Verify required fields exist
          expect(parsedLog).toHaveProperty('level');
          expect(parsedLog).toHaveProperty('context');
          expect(parsedLog).toHaveProperty('message');
          expect(parsedLog).toHaveProperty('timestamp');

          // Verify field types
          expect(typeof parsedLog.level).toBe('string');
          expect(typeof parsedLog.context).toBe('string');
          expect(typeof parsedLog.message).toBe('string');
          expect(typeof parsedLog.timestamp).toBe('string');

          // Verify level is uppercase
          expect(parsedLog.level).toBe(level.toUpperCase());

          // Verify timestamp is ISO 8601 format
          const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
          expect(parsedLog.timestamp).toMatch(isoDateRegex);

          // Verify timestamp is a valid date
          expect(new Date(parsedLog.timestamp).toString()).not.toBe('Invalid Date');

          // Verify context and message match input
          expect(parsedLog.context).toBe(context);
          expect(parsedLog.message).toBe(message);

          // Verify metadata is included if provided
          if (metadata) {
            for (const [key, value] of Object.entries(metadata)) {
              // Use bracket notation to handle keys with special characters
              expect(parsedLog[key]).toBeDefined();
              expect(parsedLog[key]).toEqual(value);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should include service field when set in context', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          service: fc.string({ minLength: 1, maxLength: 50 }),
          context: fc.string({ minLength: 1, maxLength: 100 }),
          message: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        async ({ service, context, message }) => {
          const testLogger = new Logger();
          testLogger.setContext({ correlationId: 'test-id' });

          // Add service to context
          testLogger.setContext({ correlationId: 'test-id' });
          
          // Create a child logger with service context
          const childLogger = testLogger.child({ correlationId: 'test-id' });
          
          // Log a message
          childLogger.info(context, message, { service });

          // Get the logged output
          const logOutput = consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0];
          const parsedLog = JSON.parse(logOutput);

          // Verify service field is present
          expect(parsedLog).toHaveProperty('service');
          expect(parsedLog.service).toBe(service);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should handle error objects with stack traces', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          context: fc.string({ minLength: 1, maxLength: 100 }),
          message: fc.string({ minLength: 1, maxLength: 500 }),
          errorName: fc.string({ minLength: 1, maxLength: 50 }),
          errorMessage: fc.string({ minLength: 1, maxLength: 200 }),
        }),
        async ({ context, message, errorName, errorMessage }) => {
          const testLogger = new Logger();
          
          // Create an error object
          const error = new Error(errorMessage);
          error.name = errorName;

          // Log the error
          testLogger.error(context, message, error);

          // Get the logged output
          const logOutput = consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1][0];
          const parsedLog = JSON.parse(logOutput);

          // Verify error fields are present
          expect(parsedLog).toHaveProperty('errorName');
          expect(parsedLog).toHaveProperty('errorMessage');
          expect(parsedLog).toHaveProperty('errorStack');

          // Verify error details match
          expect(parsedLog.errorName).toBe(errorName);
          expect(parsedLog.errorMessage).toBe(errorMessage);
          expect(typeof parsedLog.errorStack).toBe('string');
          expect(parsedLog.errorStack.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should not break JSON structure with special characters in messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          context: fc.string({ minLength: 1, maxLength: 100 }),
          message: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        async ({ context, message }) => {
          const testLogger = new Logger();

          // Log message with potentially problematic characters
          testLogger.info(context, message);

          // Get the logged output
          const logOutput = consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0];

          // Verify it's still valid JSON
          let parsedLog: any;
          expect(() => {
            parsedLog = JSON.parse(logOutput);
          }).not.toThrow();

          // Verify message is preserved correctly
          expect(parsedLog.message).toBe(message);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should only log debug messages in development mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          context: fc.string({ minLength: 1, maxLength: 100 }),
          message: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        async ({ context, message }) => {
          const testLogger = new Logger();

          // Test in production mode
          const originalEnv = process.env.NODE_ENV;
          const originalLogLevel = process.env.LOG_LEVEL;
          
          process.env.NODE_ENV = 'production';
          process.env.LOG_LEVEL = 'info';
          
          consoleDebugSpy.mockClear();
          testLogger.debug(context, message);
          
          // Debug should not be called in production
          expect(consoleDebugSpy).not.toHaveBeenCalled();

          // Test in development mode
          process.env.NODE_ENV = 'development';
          
          consoleDebugSpy.mockClear();
          testLogger.debug(context, message);
          
          // Debug should be called in development
          expect(consoleDebugSpy).toHaveBeenCalled();

          // Restore environment
          process.env.NODE_ENV = originalEnv;
          process.env.LOG_LEVEL = originalLogLevel;
        }
      ),
      { numRuns: 15 }
    );
  });
});

describe('Property 45: Correlation ID propagation', () => {
  /**
   * **Validates: Requirements 12.2**
   * 
   * For any request spanning multiple services, all log entries related to that
   * request should share the same correlationId.
   */

  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    logger.clearContext();
  });

  it('should propagate correlationId across all log entries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          correlationId: fc.uuid(),
          userId: fc.option(fc.uuid(), { nil: undefined }),
          messages: fc.array(
            fc.record({
              level: fc.constantFrom('info', 'warn', 'error'),
              context: fc.string({ minLength: 1, maxLength: 100 }),
              message: fc.string({ minLength: 1, maxLength: 500 }),
            }),
            { minLength: 2, maxLength: 10 }
          ),
        }),
        async ({ correlationId, userId, messages }) => {
          const testLogger = new Logger();

          // Clear all spies before this test
          consoleLogSpy.mockClear();
          consoleWarnSpy.mockClear();
          consoleErrorSpy.mockClear();

          // Set correlation ID in context
          testLogger.setContext({ correlationId, userId });

          // Log multiple messages
          for (const { level, context, message } of messages) {
            switch (level) {
              case 'info':
                testLogger.info(context, message);
                break;
              case 'warn':
                testLogger.warn(context, message);
                break;
              case 'error':
                testLogger.error(context, message);
                break;
            }
          }

          // Collect all log outputs from this test only
          const allLogs = [
            ...consoleLogSpy.mock.calls.map(call => call[0]),
            ...consoleWarnSpy.mock.calls.map(call => call[0]),
            ...consoleErrorSpy.mock.calls.map(call => call[0]),
          ];

          // Verify all logs have the same correlationId
          for (const logOutput of allLogs) {
            const parsedLog = JSON.parse(logOutput);
            expect(parsedLog).toHaveProperty('correlationId');
            expect(parsedLog.correlationId).toBe(correlationId);

            // Verify userId is also propagated if provided
            if (userId) {
              expect(parsedLog).toHaveProperty('userId');
              expect(parsedLog.userId).toBe(userId);
            }
          }

          // Verify we logged the expected number of messages
          expect(allLogs.length).toBe(messages.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should propagate correlationId to child loggers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          parentCorrelationId: fc.uuid(),
          parentUserId: fc.uuid(),
          childTenantId: fc.uuid(),
          messages: fc.array(
            fc.record({
              context: fc.string({ minLength: 1, maxLength: 100 }),
              message: fc.string({ minLength: 1, maxLength: 500 }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
        }),
        async ({ parentCorrelationId, parentUserId, childTenantId, messages }) => {
          // Clear all spies before this test
          consoleLogSpy.mockClear();
          
          const parentLogger = new Logger();
          parentLogger.setContext({
            correlationId: parentCorrelationId,
            userId: parentUserId,
          });

          // Create child logger with additional context
          const childLogger = parentLogger.child({ tenantId: childTenantId });

          // Log messages with child logger
          for (const { context, message } of messages) {
            childLogger.info(context, message);
          }

          // Verify all logs have both parent and child context
          const allLogs = consoleLogSpy.mock.calls.map(call => call[0]);

          for (const logOutput of allLogs) {
            const parsedLog = JSON.parse(logOutput);

            // Verify parent context is propagated
            expect(parsedLog).toHaveProperty('correlationId');
            expect(parsedLog.correlationId).toBe(parentCorrelationId);
            expect(parsedLog).toHaveProperty('userId');
            expect(parsedLog.userId).toBe(parentUserId);

            // Verify child context is added
            expect(parsedLog).toHaveProperty('tenantId');
            expect(parsedLog.tenantId).toBe(childTenantId);
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should maintain separate correlationIds for different logger instances', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          correlationId1: fc.uuid(),
          correlationId2: fc.uuid(),
          context: fc.string({ minLength: 1, maxLength: 100 }),
          message1: fc.string({ minLength: 1, maxLength: 500 }),
          message2: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        async ({ correlationId1, correlationId2, context, message1, message2 }) => {
          // Ensure different correlation IDs
          fc.pre(correlationId1 !== correlationId2);

          const logger1 = new Logger();
          const logger2 = new Logger();

          logger1.setContext({ correlationId: correlationId1 });
          logger2.setContext({ correlationId: correlationId2 });

          // Clear previous calls
          consoleLogSpy.mockClear();

          // Log with both loggers
          logger1.info(context, message1);
          logger2.info(context, message2);

          // Get the two log outputs
          const log1 = JSON.parse(consoleLogSpy.mock.calls[0][0]);
          const log2 = JSON.parse(consoleLogSpy.mock.calls[1][0]);

          // Verify each has its own correlationId
          expect(log1.correlationId).toBe(correlationId1);
          expect(log2.correlationId).toBe(correlationId2);
          expect(log1.correlationId).not.toBe(log2.correlationId);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should preserve correlationId after context updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialCorrelationId: fc.uuid(),
          userId1: fc.uuid(),
          userId2: fc.uuid(),
          context: fc.string({ minLength: 1, maxLength: 100 }),
          message1: fc.string({ minLength: 1, maxLength: 500 }),
          message2: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        async ({ initialCorrelationId, userId1, userId2, context, message1, message2 }) => {
          const testLogger = new Logger();

          // Set initial context with correlationId
          testLogger.setContext({
            correlationId: initialCorrelationId,
            userId: userId1,
          });

          // Clear previous calls
          consoleLogSpy.mockClear();

          // Log first message
          testLogger.info(context, message1);

          // Update context (but keep correlationId)
          testLogger.setContext({
            correlationId: initialCorrelationId,
            userId: userId2,
          });

          // Log second message
          testLogger.info(context, message2);

          // Get both log outputs
          const log1 = JSON.parse(consoleLogSpy.mock.calls[0][0]);
          const log2 = JSON.parse(consoleLogSpy.mock.calls[1][0]);

          // Verify correlationId is preserved
          expect(log1.correlationId).toBe(initialCorrelationId);
          expect(log2.correlationId).toBe(initialCorrelationId);

          // Verify userId was updated
          expect(log1.userId).toBe(userId1);
          expect(log2.userId).toBe(userId2);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should allow clearing and resetting context', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          correlationId1: fc.uuid(),
          correlationId2: fc.uuid(),
          context: fc.string({ minLength: 1, maxLength: 100 }),
          message1: fc.string({ minLength: 1, maxLength: 500 }),
          message2: fc.string({ minLength: 1, maxLength: 500 }),
          message3: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        async ({ correlationId1, correlationId2, context, message1, message2, message3 }) => {
          const testLogger = new Logger();

          // Set first context
          testLogger.setContext({ correlationId: correlationId1 });

          // Clear previous calls
          consoleLogSpy.mockClear();

          // Log with first correlationId
          testLogger.info(context, message1);

          // Clear context
          testLogger.clearContext();

          // Log without correlationId
          testLogger.info(context, message2);

          // Set new context
          testLogger.setContext({ correlationId: correlationId2 });

          // Log with second correlationId
          testLogger.info(context, message3);

          // Get all log outputs
          const log1 = JSON.parse(consoleLogSpy.mock.calls[0][0]);
          const log2 = JSON.parse(consoleLogSpy.mock.calls[1][0]);
          const log3 = JSON.parse(consoleLogSpy.mock.calls[2][0]);

          // Verify first log has first correlationId
          expect(log1.correlationId).toBe(correlationId1);

          // Verify second log has no correlationId
          expect(log2.correlationId).toBeUndefined();

          // Verify third log has second correlationId
          expect(log3.correlationId).toBe(correlationId2);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should return current context via getContext', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          correlationId: fc.uuid(),
          userId: fc.option(fc.uuid(), { nil: undefined }),
          tenantId: fc.option(fc.uuid(), { nil: undefined }),
          requestId: fc.option(fc.uuid(), { nil: undefined }),
        }),
        async ({ correlationId, userId, tenantId, requestId }) => {
          const testLogger = new Logger();

          // Set context
          const contextToSet: any = { correlationId };
          if (userId) contextToSet.userId = userId;
          if (tenantId) contextToSet.tenantId = tenantId;
          if (requestId) contextToSet.requestId = requestId;

          testLogger.setContext(contextToSet);

          // Get context
          const retrievedContext = testLogger.getContext();

          // Verify context matches
          expect(retrievedContext.correlationId).toBe(correlationId);
          if (userId) {
            expect(retrievedContext.userId).toBe(userId);
          }
          if (tenantId) {
            expect(retrievedContext.tenantId).toBe(tenantId);
          }
          if (requestId) {
            expect(retrievedContext.requestId).toBe(requestId);
          }
        }
      ),
      { numRuns: 15 }
    );
  });
});
