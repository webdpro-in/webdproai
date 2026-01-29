/**
 * Base Service Interface
 * Defines the contract for business logic layer
 */

export interface Service {
  // Marker interface for all services
}

export interface ServiceContext {
  correlationId: string;
  userId: string;
  tenantId?: string;
}
