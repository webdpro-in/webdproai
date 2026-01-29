/**
 * Async Handler Wrapper
 * Wraps async functions to catch errors and pass them to error handler
 */

import { APIGatewayEvent, APIGatewayResponse } from '../interfaces/Controller';
import { handleError } from '../middleware/errorHandler';
import { extractContext } from '../middleware/auth';

type AsyncHandler = (event: APIGatewayEvent) => Promise<APIGatewayResponse>;

export function wrapAsyncHandler(handler: AsyncHandler): AsyncHandler {
  return async (event: APIGatewayEvent): Promise<APIGatewayResponse> => {
    try {
      return await handler(event);
    } catch (error: any) {
      const context = extractContext(event);
      const includeStack = process.env.NODE_ENV !== 'production';
      return handleError(error, context.correlationId, includeStack);
    }
  };
}

export function createHandler(handler: AsyncHandler): AsyncHandler {
  return wrapAsyncHandler(handler);
}
