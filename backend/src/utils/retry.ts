/**
 * Retry Utility with Exponential Backoff
 * Handles transient failures in external service calls
 */

import { logger } from '../lib/logger';

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ProvisionedThroughputExceededException',
    'ThrottlingException',
    'RequestTimeout',
    'ServiceUnavailable',
    'InternalServerError',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
  ],
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: Error, retryableErrors: string[]): boolean {
  const errorName = error.name || '';
  const errorCode = (error as any).code || '';
  const errorMessage = error.message || '';

  return retryableErrors.some(
    retryable =>
      errorName.includes(retryable) ||
      errorCode.includes(retryable) ||
      errorMessage.includes(retryable)
  );
}

function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  return Math.min(exponentialDelay + jitter, config.maxDelay);
}

/**
 * Execute an operation with retry logic and exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      const isRetryable = isRetryableError(error, finalConfig.retryableErrors);
      const isLastAttempt = attempt === finalConfig.maxAttempts;

      if (!isRetryable || isLastAttempt) {
        logger.error(
          'withRetry',
          `Operation failed after ${attempt} attempt(s)`,
          error,
          {
            attempt,
            maxAttempts: finalConfig.maxAttempts,
            isRetryable,
            errorName: error.name,
            errorCode: error.code,
          }
        );
        throw error;
      }

      const delay = calculateDelay(attempt, finalConfig);

      logger.warn('withRetry', 'Operation failed, retrying', {
        attempt,
        maxAttempts: finalConfig.maxAttempts,
        delay,
        nextAttempt: attempt + 1,
        errorName: error.name,
        errorMessage: error.message,
      });

      if (finalConfig.onRetry) {
        finalConfig.onRetry(attempt, error, delay);
      }

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Create a retry wrapper for a function
 */
export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: Partial<RetryConfig> = {}
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return withRetry(() => fn(...args), config);
  }) as T;
}

/**
 * Retry configuration presets for common scenarios
 */
export const RetryPresets = {
  /**
   * For DynamoDB operations
   */
  dynamodb: {
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 5000,
    backoffMultiplier: 2,
    retryableErrors: [
      'ProvisionedThroughputExceededException',
      'ThrottlingException',
      'RequestLimitExceeded',
    ],
  } as Partial<RetryConfig>,

  /**
   * For external API calls
   */
  externalApi: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      'RequestTimeout',
      'ServiceUnavailable',
      'InternalServerError',
      'ECONNRESET',
      'ETIMEDOUT',
    ],
  } as Partial<RetryConfig>,

  /**
   * For S3 operations
   */
  s3: {
    maxAttempts: 3,
    initialDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    retryableErrors: [
      'RequestTimeout',
      'ServiceUnavailable',
      'SlowDown',
    ],
  } as Partial<RetryConfig>,

  /**
   * For Bedrock AI operations
   */
  bedrock: {
    maxAttempts: 2,
    initialDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      'ThrottlingException',
      'ModelTimeoutException',
      'ServiceUnavailable',
    ],
  } as Partial<RetryConfig>,
};
