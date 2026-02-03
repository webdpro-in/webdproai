/**
 * Structured Logger Utility
 * Provides consistent JSON-formatted logging across all Lambda handlers
 */

export interface LogMetadata {
  [key: string]: any;
}

export const logger = {
  /**
   * Log informational messages
   */
  info: (context: string, message: string, metadata?: LogMetadata) => {
    console.log(JSON.stringify({
      level: 'INFO',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...metadata,
    }));
  },

  /**
   * Log error messages with optional Error object
   */
  error: (context: string, message: string, error?: Error, metadata?: LogMetadata) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      context,
      message,
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
      timestamp: new Date().toISOString(),
      ...metadata,
    }));
  },

  /**
   * Log warning messages
   */
  warn: (context: string, message: string, metadata?: LogMetadata) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...metadata,
    }));
  },
};
