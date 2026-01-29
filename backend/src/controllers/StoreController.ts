/**
 * Store Controller
 * HTTP request handlers for store endpoints
 */

import { Controller, APIGatewayEvent, APIGatewayResponse } from '../interfaces/Controller';
import { StoreService, CreateStoreData } from '../services/StoreService';
import { Store } from '../types';
import { extractContext, requireAuth } from '../middleware/auth';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
} from '../utils/response';
import {
  validateRequired,
  validateString,
  parseJSON,
  ValidationError,
} from '../utils/validation';

export class StoreController implements Controller {
  constructor(private readonly storeService: StoreService) {}

  async handle(event: APIGatewayEvent): Promise<APIGatewayResponse> {
    try {
      const context = extractContext(event);
      requireAuth(context);

      const method = event.requestContext?.httpMethod || 'GET';
      const pathParams = event.pathParameters || {};

      switch (method) {
        case 'POST':
          return this.createStore(event, context);
        case 'GET':
          if (pathParams.storeId) {
            return this.getStore(event, context);
          }
          return this.listStores(event, context);
        case 'PUT':
          return this.updateStore(event, context);
        case 'DELETE':
          return this.deleteStore(event, context);
        default:
          return errorResponse('Method not allowed', 405);
      }
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return unauthorizedResponse();
      }
      if (error instanceof ValidationError) {
        return validationErrorResponse(error.message, { field: error.field });
      }
      return errorResponse(error.message || 'Internal server error', 500);
    }
  }

  private async createStore(
    event: APIGatewayEvent,
    context: any
  ): Promise<APIGatewayResponse> {
    try {
      const body = parseJSON<CreateStoreData>(event.body);

      // Validate required fields
      validateRequired(body.businessName, 'businessName');
      validateString(body.businessName, 'businessName', { minLength: 1, maxLength: 100 });
      
      validateRequired(body.businessType, 'businessType');
      validateString(body.businessType, 'businessType');
      
      validateRequired(body.description, 'description');
      validateString(body.description, 'description', { minLength: 10, maxLength: 500 });

      const store = await this.storeService.createStore(context, body);

      return successResponse(store, 201);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        return validationErrorResponse(error.message, { field: error.field });
      }
      return errorResponse(error.message, 500);
    }
  }

  private async getStore(
    event: APIGatewayEvent,
    context: any
  ): Promise<APIGatewayResponse> {
    try {
      const storeId = event.pathParameters?.storeId;
      if (!storeId) {
        return validationErrorResponse('Store ID is required');
      }

      const store = await this.storeService.getStore(context, storeId);

      if (!store) {
        return notFoundResponse('Store', storeId);
      }

      return successResponse(store);
    } catch (error: any) {
      if (error.message.includes('Access denied')) {
        return errorResponse(error.message, 403);
      }
      return errorResponse(error.message, 500);
    }
  }

  private async listStores(
    event: APIGatewayEvent,
    context: any
  ): Promise<APIGatewayResponse> {
    try {
      const queryParams = event.queryStringParameters || {};
      const limit = queryParams.limit ? parseInt(queryParams.limit) : 50;

      const result = await this.storeService.listStores(context, { limit });

      return successResponse(result);
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  }

  private async updateStore(
    event: APIGatewayEvent,
    context: any
  ): Promise<APIGatewayResponse> {
    try {
      const storeId = event.pathParameters?.storeId;
      if (!storeId) {
        return validationErrorResponse('Store ID is required');
      }

      const updates = parseJSON(event.body) as Partial<Store>;
      const store = await this.storeService.updateStore(context, storeId, updates);

      return successResponse(store);
    } catch (error: any) {
      if (error.message === 'Store not found') {
        return notFoundResponse('Store', event.pathParameters?.storeId);
      }
      if (error.message.includes('Access denied')) {
        return errorResponse(error.message, 403);
      }
      return errorResponse(error.message, 500);
    }
  }

  private async deleteStore(
    event: APIGatewayEvent,
    context: any
  ): Promise<APIGatewayResponse> {
    try {
      const storeId = event.pathParameters?.storeId;
      if (!storeId) {
        return validationErrorResponse('Store ID is required');
      }

      await this.storeService.deleteStore(context, storeId);

      return successResponse({ message: 'Store deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Store not found') {
        return notFoundResponse('Store', event.pathParameters?.storeId);
      }
      if (error.message.includes('Access denied')) {
        return errorResponse(error.message, 403);
      }
      return errorResponse(error.message, 500);
    }
  }
}
