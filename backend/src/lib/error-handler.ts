/**
 * Error Handler Wrapper Utility
 * Ensures all Lambda handlers return proper CORS headers even on unhandled errors
 */

import { logger } from './logger';

interface APIGatewayEvent {
  path?: string;
  httpMethod?: string;
  [key: string]: any;
}

interface APIGatewayResponse {
  statusCode: number;
  headers: Record<string, string | boolean>;
  body: string;
}

type LambdaHandler = (event: APIGatewayEvent) => Promise<APIGatewayResponse>;

/**
 * Wraps a Lambda handler to ensure all errors return responses with CORS headers
 */
export function withErrorHandling(handler: LambdaHandler): LambdaHandler {
  return async (event: APIGatewayEvent): Promise<APIGatewayResponse> => {
    try {
      return await handler(event);
    } catch (error: any) {
      logger.error(
        'ErrorHandler',
        'Unhandled error in Lambda handler',
        error,
        {
          path: event.path,
          method: event.httpMethod,
        }
      );

      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Internal server error' }),
      };
    }
  };
}
