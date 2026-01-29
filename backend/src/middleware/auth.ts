/**
 * Authentication Middleware
 * Extract and validate user context from JWT tokens
 */

import { APIGatewayEvent } from '../interfaces/Controller';
import { ControllerContext } from '../interfaces/Controller';
import { generateCorrelationId } from '../utils/id-generator';

export function extractContext(event: APIGatewayEvent): ControllerContext {
  const correlationId = event.headers['x-request-id'] || 
                       event.headers['X-Request-ID'] || 
                       event.requestContext?.requestId ||
                       generateCorrelationId();
  
  // Try to get from authorizer first (if configured)
  const authorizerClaims = event.requestContext?.authorizer?.claims;
  if (authorizerClaims) {
    return {
      correlationId,
      userId: authorizerClaims.sub || authorizerClaims['cognito:username'],
      tenantId: authorizerClaims['custom:tenant_id'],
    };
  }
  
  // Fallback: decode JWT from Authorization header
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return { correlationId };
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    return {
      correlationId,
      userId: payload.sub || payload['cognito:username'],
      tenantId: payload['custom:tenant_id'],
    };
  } catch (error) {
    return { correlationId };
  }
}

export function requireAuth(context: ControllerContext): void {
  if (!context.userId) {
    throw new Error('Authentication required');
  }
}

export function requireTenant(context: ControllerContext): void {
  requireAuth(context);
  if (!context.tenantId) {
    throw new Error('Tenant context required');
  }
}
