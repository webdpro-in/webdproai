/**
 * ID Generation Utilities
 * Consistent ID generation across the application
 */

import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function generateStoreId(): string {
  return `store_${uuidv4()}`;
}

export function generateOrderId(): string {
  return `order_${uuidv4()}`;
}

export function generateDomainId(): string {
  return `domain_${uuidv4()}`;
}

export function generateCorrelationId(): string {
  return `corr_${uuidv4()}`;
}

export function generateTenantId(): string {
  return `tenant_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
