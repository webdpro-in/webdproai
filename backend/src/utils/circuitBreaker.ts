/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascade failures when external services are unavailable
 */

import { logger } from '../lib/logger';

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  successThreshold: number;      // Number of successes to close from half-open
  timeout: number;               // Milliseconds before attempting retry
  monitoringPeriod: number;      // Time window for failure counting (ms)
  onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreakerError extends Error {
  constructor(message: string = 'Circuit breaker is OPEN') {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();
  private lastFailureTime = 0;
  private readonly name: string;

  constructor(
    name: string,
    private readonly config: CircuitBreakerConfig
  ) {
    this.name = name;
    logger.info('CircuitBreaker', `Initialized circuit breaker: ${name}`, {
      config: this.config,
    });
  }

  /**
   * Execute an operation through the circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        logger.warn('CircuitBreaker', `Circuit breaker ${this.name} is OPEN`, {
          nextAttempt: new Date(this.nextAttempt).toISOString(),
          failureCount: this.failureCount,
        });
        throw new CircuitBreakerError(`Circuit breaker ${this.name} is OPEN`);
      }
      
      // Transition to half-open to test the service
      this.transitionTo('HALF_OPEN');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      
      logger.info('CircuitBreaker', `Success in HALF_OPEN state for ${this.name}`, {
        successCount: this.successCount,
        successThreshold: this.config.successThreshold,
      });

      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
        this.successCount = 0;
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    const now = Date.now();
    
    // Reset failure count if outside monitoring period
    if (this.lastFailureTime && (now - this.lastFailureTime) > this.config.monitoringPeriod) {
      this.failureCount = 0;
    }

    this.failureCount++;
    this.lastFailureTime = now;
    this.successCount = 0;

    logger.warn('CircuitBreaker', `Failure recorded for ${this.name}`, {
      failureCount: this.failureCount,
      failureThreshold: this.config.failureThreshold,
      state: this.state,
    });

    if (this.failureCount >= this.config.failureThreshold) {
      this.nextAttempt = now + this.config.timeout;
      this.transitionTo('OPEN');
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    
    if (oldState === newState) {
      return;
    }

    this.state = newState;

    logger.info('CircuitBreaker', `State transition for ${this.name}`, {
      from: oldState,
      to: newState,
      failureCount: this.failureCount,
      ...(newState === 'OPEN' && {
        nextAttempt: new Date(this.nextAttempt).toISOString(),
      }),
    });

    if (this.config.onStateChange) {
      this.config.onStateChange(oldState, newState);
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    logger.info('CircuitBreaker', `Manually resetting ${this.name}`);
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }

  /**
   * Manually open the circuit breaker
   */
  open(): void {
    logger.info('CircuitBreaker', `Manually opening ${this.name}`);
    this.nextAttempt = Date.now() + this.config.timeout;
    this.transitionTo('OPEN');
  }
}

/**
 * Circuit breaker configuration presets
 */
export const CircuitBreakerPresets = {
  /**
   * For external API calls
   */
  externalApi: {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000,        // 1 minute
    monitoringPeriod: 120000, // 2 minutes
  } as CircuitBreakerConfig,

  /**
   * For database operations
   */
  database: {
    failureThreshold: 10,
    successThreshold: 3,
    timeout: 30000,        // 30 seconds
    monitoringPeriod: 60000,  // 1 minute
  } as CircuitBreakerConfig,

  /**
   * For AI/ML services (more tolerant)
   */
  aiService: {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 120000,       // 2 minutes
    monitoringPeriod: 300000, // 5 minutes
  } as CircuitBreakerConfig,
};

/**
 * Circuit breaker registry for managing multiple breakers
 */
export class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker
   */
  getOrCreate(name: string, config: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breakers
   */
  getAll(): CircuitBreaker[] {
    return Array.from(this.breakers.values());
  }

  /**
   * Get metrics for all circuit breakers
   */
  getAllMetrics() {
    return Array.from(this.breakers.values()).map(breaker => breaker.getMetrics());
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

// Export singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();
