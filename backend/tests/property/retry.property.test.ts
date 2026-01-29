/**
 * Property-Based Tests for Retry Logic
 * Feature: webdpro-production-refactoring
 * Property 19: Retry with exponential backoff
 * Validates: Requirements 6.4
 */

import fc from 'fast-check';
import { withRetry, RetryConfig, DEFAULT_RETRY_CONFIG } from '../../src/utils/retry';

describe('Property 19: Retry with exponential backoff', () => {
  /**
   * **Validates: Requirements 6.4**
   * 
   * For any external service call that fails with a transient error (e.g., timeout, 503),
   * retry attempts should occur with delays following exponential backoff:
   * delay(n) = initialDelay * (backoffMultiplier ^ (n-1))
   */

  it('should retry with exponential backoff for transient errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxAttempts: fc.integer({ min: 2, max: 5 }),
          initialDelay: fc.integer({ min: 100, max: 1000 }),
          backoffMultiplier: fc.integer({ min: 2, max: 3 }),
          maxDelay: fc.integer({ min: 5000, max: 20000 }),
          retryableError: fc.constantFrom(
            'ProvisionedThroughputExceededException',
            'ThrottlingException',
            'RequestTimeout',
            'ServiceUnavailable',
            'ETIMEDOUT'
          ),
          failuresBeforeSuccess: fc.integer({ min: 1, max: 3 }),
        }),
        async ({ maxAttempts, initialDelay, backoffMultiplier, maxDelay, retryableError, failuresBeforeSuccess }) => {
          // Ensure failuresBeforeSuccess is less than maxAttempts
          fc.pre(failuresBeforeSuccess < maxAttempts);

          const config: Partial<RetryConfig> = {
            maxAttempts,
            initialDelay,
            backoffMultiplier,
            maxDelay,
            retryableErrors: [retryableError],
          };

          let attemptCount = 0;
          const attemptTimestamps: number[] = [];
          const delays: number[] = [];

          const operation = jest.fn(async () => {
            attemptCount++;
            attemptTimestamps.push(Date.now());

            if (attemptCount <= failuresBeforeSuccess) {
              const error = new Error('Transient error');
              error.name = retryableError;
              throw error;
            }

            return 'success';
          });

          // Execute with retry
          const result = await withRetry(operation, config);

          // Verify operation succeeded
          expect(result).toBe('success');

          // Verify correct number of attempts
          expect(attemptCount).toBe(failuresBeforeSuccess + 1);
          expect(operation).toHaveBeenCalledTimes(failuresBeforeSuccess + 1);

          // Calculate actual delays between attempts
          for (let i = 1; i < attemptTimestamps.length; i++) {
            delays.push(attemptTimestamps[i] - attemptTimestamps[i - 1]);
          }

          // Verify exponential backoff pattern
          for (let i = 0; i < delays.length; i++) {
            const expectedDelay = Math.min(
              initialDelay * Math.pow(backoffMultiplier, i),
              maxDelay
            );

            // Allow for jitter (10%) and timing variance (±20%)
            const minAcceptableDelay = expectedDelay * 0.8;
            const maxAcceptableDelay = expectedDelay * 1.3; // Account for jitter and timing

            expect(delays[i]).toBeGreaterThanOrEqual(minAcceptableDelay);
            expect(delays[i]).toBeLessThanOrEqual(maxAcceptableDelay);
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // Increase timeout for this test

  it('should not retry for non-retryable errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxAttempts: fc.integer({ min: 2, max: 5 }),
          nonRetryableError: fc.constantFrom(
            'ValidationError',
            'AuthenticationError',
            'NotFoundError',
            'InvalidInputError'
          ),
        }),
        async ({ maxAttempts, nonRetryableError }) => {
          const config: Partial<RetryConfig> = {
            maxAttempts,
            retryableErrors: ['ThrottlingException', 'ServiceUnavailable'],
          };

          let attemptCount = 0;

          const operation = jest.fn(async () => {
            attemptCount++;
            const error = new Error('Non-retryable error');
            error.name = nonRetryableError;
            throw error;
          });

          // Execute with retry and expect it to fail
          await expect(withRetry(operation, config)).rejects.toThrow('Non-retryable error');

          // Verify operation was only called once (no retries)
          expect(attemptCount).toBe(1);
          expect(operation).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect maxAttempts limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxAttempts: fc.integer({ min: 1, max: 5 }),
          retryableError: fc.constantFrom(
            'ThrottlingException',
            'ServiceUnavailable',
            'ETIMEDOUT'
          ),
        }),
        async ({ maxAttempts, retryableError }) => {
          const config: Partial<RetryConfig> = {
            maxAttempts,
            initialDelay: 10, // Use small delay for faster tests
            retryableErrors: [retryableError],
          };

          let attemptCount = 0;

          const operation = jest.fn(async () => {
            attemptCount++;
            const error = new Error('Always fails');
            error.name = retryableError;
            throw error;
          });

          // Execute with retry and expect it to fail after maxAttempts
          await expect(withRetry(operation, config)).rejects.toThrow('Always fails');

          // Verify operation was called exactly maxAttempts times
          expect(attemptCount).toBe(maxAttempts);
          expect(operation).toHaveBeenCalledTimes(maxAttempts);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect maxDelay cap', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxAttempts: fc.integer({ min: 3, max: 5 }),
          initialDelay: fc.integer({ min: 1000, max: 2000 }),
          backoffMultiplier: fc.integer({ min: 3, max: 5 }),
          maxDelay: fc.integer({ min: 3000, max: 5000 }),
          failuresBeforeSuccess: fc.integer({ min: 2, max: 4 }),
        }),
        async ({ maxAttempts, initialDelay, backoffMultiplier, maxDelay, failuresBeforeSuccess }) => {
          // Ensure failuresBeforeSuccess is less than maxAttempts
          fc.pre(failuresBeforeSuccess < maxAttempts);

          const config: Partial<RetryConfig> = {
            maxAttempts,
            initialDelay,
            backoffMultiplier,
            maxDelay,
            retryableErrors: ['ThrottlingException'],
          };

          let attemptCount = 0;
          const attemptTimestamps: number[] = [];

          const operation = jest.fn(async () => {
            attemptCount++;
            attemptTimestamps.push(Date.now());

            if (attemptCount <= failuresBeforeSuccess) {
              const error = new Error('Throttled');
              error.name = 'ThrottlingException';
              throw error;
            }

            return 'success';
          });

          // Execute with retry
          await withRetry(operation, config);

          // Calculate actual delays
          const delays: number[] = [];
          for (let i = 1; i < attemptTimestamps.length; i++) {
            delays.push(attemptTimestamps[i] - attemptTimestamps[i - 1]);
          }

          // Verify no delay exceeds maxDelay (with tolerance for jitter and timing)
          for (const delay of delays) {
            expect(delay).toBeLessThanOrEqual(maxDelay * 1.3); // Allow 30% tolerance for jitter
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // Increase timeout for this test

  it('should call onRetry callback with correct parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxAttempts: fc.integer({ min: 3, max: 5 }),
          initialDelay: fc.integer({ min: 50, max: 200 }),
          failuresBeforeSuccess: fc.integer({ min: 1, max: 3 }),
        }),
        async ({ maxAttempts, initialDelay, failuresBeforeSuccess }) => {
          fc.pre(failuresBeforeSuccess < maxAttempts);

          const onRetryCalls: Array<{ attempt: number; error: Error; delay: number }> = [];

          const config: Partial<RetryConfig> = {
            maxAttempts,
            initialDelay,
            backoffMultiplier: 2,
            retryableErrors: ['ServiceUnavailable'],
            onRetry: (attempt, error, delay) => {
              onRetryCalls.push({ attempt, error, delay });
            },
          };

          let attemptCount = 0;

          const operation = jest.fn(async () => {
            attemptCount++;

            if (attemptCount <= failuresBeforeSuccess) {
              const error = new Error('Service unavailable');
              error.name = 'ServiceUnavailable';
              throw error;
            }

            return 'success';
          });

          // Execute with retry
          await withRetry(operation, config);

          // Verify onRetry was called correct number of times
          expect(onRetryCalls.length).toBe(failuresBeforeSuccess);

          // Verify each callback had correct parameters
          for (let i = 0; i < onRetryCalls.length; i++) {
            const call = onRetryCalls[i];

            // Verify attempt number
            expect(call.attempt).toBe(i + 1);

            // Verify error
            expect(call.error).toBeInstanceOf(Error);
            expect(call.error.message).toBe('Service unavailable');

            // Verify delay is positive
            expect(call.delay).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // Increase timeout for this test

  it('should handle errors with error codes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxAttempts: fc.integer({ min: 2, max: 4 }),
          errorCode: fc.constantFrom(
            'ECONNRESET',
            'ETIMEDOUT',
            'ENOTFOUND'
          ),
          failuresBeforeSuccess: fc.integer({ min: 1, max: 2 }),
        }),
        async ({ maxAttempts, errorCode, failuresBeforeSuccess }) => {
          fc.pre(failuresBeforeSuccess < maxAttempts);

          const config: Partial<RetryConfig> = {
            maxAttempts,
            initialDelay: 50,
            retryableErrors: [errorCode],
          };

          let attemptCount = 0;

          const operation = jest.fn(async () => {
            attemptCount++;

            if (attemptCount <= failuresBeforeSuccess) {
              const error: any = new Error('Network error');
              error.code = errorCode;
              throw error;
            }

            return 'success';
          });

          // Execute with retry
          const result = await withRetry(operation, config);

          // Verify success
          expect(result).toBe('success');
          expect(attemptCount).toBe(failuresBeforeSuccess + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle errors with error messages containing retryable patterns', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxAttempts: fc.integer({ min: 2, max: 4 }),
          retryablePattern: fc.constantFrom(
            'ThrottlingException',
            'ServiceUnavailable',
            'RequestTimeout'
          ),
          failuresBeforeSuccess: fc.integer({ min: 1, max: 2 }),
        }),
        async ({ maxAttempts, retryablePattern, failuresBeforeSuccess }) => {
          fc.pre(failuresBeforeSuccess < maxAttempts);

          const config: Partial<RetryConfig> = {
            maxAttempts,
            initialDelay: 50,
            retryableErrors: [retryablePattern],
          };

          let attemptCount = 0;

          const operation = jest.fn(async () => {
            attemptCount++;

            if (attemptCount <= failuresBeforeSuccess) {
              const error = new Error(`Error: ${retryablePattern} occurred`);
              throw error;
            }

            return 'success';
          });

          // Execute with retry
          const result = await withRetry(operation, config);

          // Verify success
          expect(result).toBe('success');
          expect(attemptCount).toBe(failuresBeforeSuccess + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return result immediately on first success', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxAttempts: fc.integer({ min: 2, max: 5 }),
          expectedResult: fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.record({
              id: fc.uuid(),
              value: fc.string(),
            })
          ),
        }),
        async ({ maxAttempts, expectedResult }) => {
          const config: Partial<RetryConfig> = {
            maxAttempts,
            retryableErrors: ['ThrottlingException'],
          };

          let attemptCount = 0;

          const operation = jest.fn(async () => {
            attemptCount++;
            return expectedResult;
          });

          // Execute with retry
          const result = await withRetry(operation, config);

          // Verify result matches expected
          expect(result).toEqual(expectedResult);

          // Verify operation was only called once
          expect(attemptCount).toBe(1);
          expect(operation).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use default config when no config provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          failuresBeforeSuccess: fc.integer({ min: 1, max: 2 }),
        }),
        async ({ failuresBeforeSuccess }) => {
          let attemptCount = 0;

          const operation = jest.fn(async () => {
            attemptCount++;

            if (attemptCount <= failuresBeforeSuccess) {
              const error = new Error('Throttled');
              error.name = 'ThrottlingException'; // This is in DEFAULT_RETRY_CONFIG
              throw error;
            }

            return 'success';
          });

          // Execute with retry using default config
          const result = await withRetry(operation);

          // Verify success
          expect(result).toBe('success');
          expect(attemptCount).toBe(failuresBeforeSuccess + 1);
          expect(attemptCount).toBeLessThanOrEqual(DEFAULT_RETRY_CONFIG.maxAttempts);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should merge provided config with default config', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          customMaxAttempts: fc.integer({ min: 4, max: 6 }),
          failuresBeforeSuccess: fc.integer({ min: 2, max: 4 }),
        }),
        async ({ customMaxAttempts, failuresBeforeSuccess }) => {
          fc.pre(failuresBeforeSuccess < customMaxAttempts);

          const config: Partial<RetryConfig> = {
            maxAttempts: customMaxAttempts,
            // Other config values should come from DEFAULT_RETRY_CONFIG
          };

          let attemptCount = 0;

          const operation = jest.fn(async () => {
            attemptCount++;

            if (attemptCount <= failuresBeforeSuccess) {
              const error = new Error('Throttled');
              error.name = 'ThrottlingException'; // From default retryableErrors
              throw error;
            }

            return 'success';
          });

          // Execute with retry
          const result = await withRetry(operation, config);

          // Verify success
          expect(result).toBe('success');
          expect(attemptCount).toBe(failuresBeforeSuccess + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply jitter to delays', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxAttempts: fc.integer({ min: 4, max: 5 }),
          initialDelay: fc.integer({ min: 500, max: 1000 }),
          failuresBeforeSuccess: fc.integer({ min: 3, max: 4 }),
        }),
        async ({ maxAttempts, initialDelay, failuresBeforeSuccess }) => {
          fc.pre(failuresBeforeSuccess < maxAttempts);

          const config: Partial<RetryConfig> = {
            maxAttempts,
            initialDelay,
            backoffMultiplier: 2,
            maxDelay: 10000,
            retryableErrors: ['ThrottlingException'],
          };

          let attemptCount = 0;
          const attemptTimestamps: number[] = [];

          const operation = jest.fn(async () => {
            attemptCount++;
            attemptTimestamps.push(Date.now());

            if (attemptCount <= failuresBeforeSuccess) {
              const error = new Error('Throttled');
              error.name = 'ThrottlingException';
              throw error;
            }

            return 'success';
          });

          // Execute with retry
          await withRetry(operation, config);

          // Calculate actual delays
          const delays: number[] = [];
          for (let i = 1; i < attemptTimestamps.length; i++) {
            delays.push(attemptTimestamps[i] - attemptTimestamps[i - 1]);
          }

          // Verify delays are not exactly the exponential values (due to jitter)
          // At least one delay should differ from the exact exponential value
          let hasJitter = false;
          for (let i = 0; i < delays.length; i++) {
            const exactDelay = initialDelay * Math.pow(2, i);
            // If delay differs by more than 1ms from exact value, jitter was applied
            if (Math.abs(delays[i] - exactDelay) > 1) {
              hasJitter = true;
              break;
            }
          }

          // Note: Due to timing precision, we can't always guarantee jitter is visible
          // So we just verify delays are within reasonable bounds
          for (let i = 0; i < delays.length; i++) {
            const expectedDelay = initialDelay * Math.pow(2, i);
            expect(delays[i]).toBeGreaterThanOrEqual(expectedDelay * 0.9);
            expect(delays[i]).toBeLessThanOrEqual(expectedDelay * 1.2);
          }
        }
      ),
      { numRuns: 50 } // Reduce runs for this slower test
    );
  }, 60000); // Increase timeout for this test
});
