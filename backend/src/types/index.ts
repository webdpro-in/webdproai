/**
 * Core Type Definitions for WebDPro Backend
 * Centralized type definitions for domain models, API contracts, and configurations
 */

// ============ Domain Models ============

export interface Store extends Record<string, unknown> {
  storeId: string;
  userId: string;
  tenantId: string;
  businessName: string;
  businessType: string;
  description: string;
  status: 'draft' | 'generating' | 'active' | 'suspended' | 'error';
  websiteUrl?: string;
  customDomain?: string;
  cloudFrontDistributionId?: string;
  s3Bucket?: string;
  s3Prefix?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  userId: string;
  phone: string;
  email?: string;
  name?: string;
  role: 'CUSTOMER' | 'BUSINESS_OWNER' | 'DELIVERY_AGENT' | 'ADMIN';
  tenantId?: string;
  plan?: 'free' | 'basic' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  orderId: string;
  storeId: string;
  tenantId: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  currency: string;
  status: 'pending_payment' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentId?: string;
  deliveryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Domain {
  domainId: string;
  userId: string;
  storeId: string;
  domainName: string;
  registrar: 'route53' | 'hostinger' | 'other';
  status: DomainConnectionStatus;
  certificateArn?: string;
  hostedZoneId?: string;
  configurationSteps: DomainConfigurationStep[];
  connectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DomainConnectionStatus =
  | 'validating_domain'
  | 'configuring_dns'
  | 'requesting_certificate'
  | 'validating_certificate'
  | 'updating_cloudfront'
  | 'completed'
  | 'failed';

export interface DomainConfigurationStep {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message: string;
  timestamp: string;
}

// ============ API Request/Response Types ============

export interface CreateStoreRequest {
  prompt: string;
  storeType?: string;
  language?: string;
  currency?: string;
}

export interface CreateStoreResponse {
  success: boolean;
  message: string;
  store: {
    store_id: string;
    status: string;
    config?: unknown;
    preview_url?: string;
  };
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  lastEvaluatedKey?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  items: T[];
  count: number;
  lastEvaluatedKey?: Record<string, unknown>;
}

// ============ Error Types ============

export interface ErrorDetails {
  code: string;
  message: string;
  correlationId?: string;
  details?: Record<string, unknown>;
}

// ============ Event Types ============

export interface DomainEvent {
  eventId: string;
  eventType: string;
  eventVersion: string;
  timestamp: string;
  source: string;
  correlationId: string;
  userId: string;
  payload: Record<string, unknown>;
}

// ============ Configuration Types ============

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'staging' | 'production';
  AWS_REGION: string;
  AWS_ACCOUNT_ID?: string;
  
  // DynamoDB
  DYNAMODB_TABLE_PREFIX: string;
  STORES_TABLE: string;
  USERS_TABLE: string;
  ORDERS_TABLE: string;
  DOMAINS_TABLE: string;
  
  // S3
  S3_BUCKET: string;
  AWS_S3_REGION: string;
  
  // CloudFront
  CLOUDFRONT_DISTRIBUTION_ID?: string;
  
  // Cognito
  COGNITO_USER_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  
  // External Services
  AI_SERVICE_URL?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  
  // Monitoring
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  ENABLE_XRAY?: boolean;
}
