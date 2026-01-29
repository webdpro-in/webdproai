/**
 * Environment Configuration
 * Validates and provides type-safe access to environment variables
 */

import { EnvironmentConfig } from '../types';
import { ConfigurationError } from '../errors/AppError';

class EnvironmentValidator {
  private config: EnvironmentConfig | null = null;

  /**
   * Validate and load environment configuration
   * Throws ConfigurationError if required variables are missing
   */
  validate(): EnvironmentConfig {
    if (this.config) {
      return this.config;
    }

    const required = [
      'AWS_REGION',
      'DYNAMODB_TABLE_PREFIX',
      'COGNITO_USER_POOL_ID',
      'COGNITO_CLIENT_ID',
      'S3_BUCKET',
    ];

    const missing: string[] = [];
    for (const key of required) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      throw new ConfigurationError(
        `Missing required environment variables: ${missing.join(', ')}`,
        { missing }
      );
    }

    const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || 'webdpro';

    this.config = {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      AWS_REGION: process.env.AWS_REGION!,
      AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
      
      // DynamoDB
      DYNAMODB_TABLE_PREFIX: tablePrefix,
      STORES_TABLE: `${tablePrefix}-stores`,
      USERS_TABLE: `${tablePrefix}-users`,
      ORDERS_TABLE: `${tablePrefix}-orders`,
      DOMAINS_TABLE: `${tablePrefix}-domains`,
      
      // S3
      S3_BUCKET: process.env.S3_BUCKET!,
      AWS_S3_REGION: process.env.AWS_S3_REGION || process.env.AWS_REGION!,
      
      // CloudFront
      CLOUDFRONT_DISTRIBUTION_ID: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      
      // Cognito
      COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID!,
      COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID!,
      
      // External Services
      AI_SERVICE_URL: process.env.AI_SERVICE_URL,
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || process.env.WEBDPRO_RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || process.env.WEBDPRO_RAZORPAY_KEY_SECRET,
      
      // Monitoring
      LOG_LEVEL: (process.env.LOG_LEVEL as any) || 'info',
      ENABLE_XRAY: process.env.ENABLE_XRAY === 'true',
    };

    return this.config;
  }

  /**
   * Get validated configuration
   * Throws if not yet validated
   */
  get(): EnvironmentConfig {
    if (!this.config) {
      throw new ConfigurationError('Environment not validated. Call validate() first.');
    }
    return this.config;
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.get().NODE_ENV === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.get().NODE_ENV === 'development';
  }

  /**
   * Reset configuration (useful for testing)
   */
  reset(): void {
    this.config = null;
  }
}

// Export singleton instance
export const env = new EnvironmentValidator();

// Validate on module load
try {
  env.validate();
  console.log('[Environment] Configuration validated successfully');
} catch (error) {
  console.error('[Environment] Configuration validation failed:', error);
  // Don't throw here - let the Lambda fail on first invocation
}
