/**
 * Base Controller Interface
 * Defines the contract for all HTTP request handlers
 */

export interface APIGatewayEvent {
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  body: string | null;
  headers: Record<string, string>;
  requestContext?: {
    requestId: string;
    httpMethod?: string;
    authorizer?: {
      claims?: Record<string, string>;
    };
  };
}

export interface APIGatewayResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface Controller {
  handle(event: APIGatewayEvent): Promise<APIGatewayResponse>;
}

export interface ControllerContext {
  correlationId: string;
  userId?: string;
  tenantId?: string;
}
