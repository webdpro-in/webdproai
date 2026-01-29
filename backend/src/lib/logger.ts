/**
 * Structured Logger Utility
 * Provides consistent JSON-formatted logging across all Lambda handlers
 * with correlation ID support for distributed tracing
 */

export interface LogMetadata {
  [key: string]: any;
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  requestId?: string;
}

class Logger {
  private context: LogContext = {};

  /**
   * Set context for all subsequent log entries
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear the current context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Get the current context
   */
  getContext(): LogContext {
    return { ...this.context };
  }

  /**
   * Log debug messages (only in development)
   */
  debug(context: string, message: string, metadata?: LogMetadata): void {
    if (process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({
        level: 'DEBUG',
        context,
        message,
        timestamp: new Date().toISOString(),
        ...this.context,
        ...metadata,
      }));
    }
  }

  /**
   * Log informational messages
   */
  info(context: string, message: string, metadata?: LogMetadata): void {
    console.log(JSON.stringify({
      level: 'INFO',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...metadata,
    }));
  }

  /**
   * Log warning messages
   */
  warn(context: string, message: string, metadata?: LogMetadata): void {
    console.warn(JSON.stringify({
      level: 'WARN',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...metadata,
    }));
  }

  /**
   * Log error messages with optional Error object
   */
  error(context: string, message: string, error?: Error, metadata?: LogMetadata): void {
    console.error(JSON.stringify({
      level: 'ERROR',
      context,
      message,
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...metadata,
    }));
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setContext({ ...this.context, ...additionalContext });
    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };
