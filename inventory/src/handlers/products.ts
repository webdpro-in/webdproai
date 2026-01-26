/**
 * WebDPro Inventory Service - Products Handler
 * Central inventory management for all merchant businesses
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
const TABLE_NAME = process.env.DYNAMODB_TABLE_PREFIX ? `${process.env.DYNAMODB_TABLE_PREFIX}-products` : 'webdpro-products';

const response = (statusCode: number, body: any): APIGatewayProxyResult => ({
   statusCode,
   headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
   },
   body: JSON.stringify(body),
});

// Helper: Generate simple keywords
function generateSearchKeywords(name: string, description: string = '', category: string = ''): string[] {
   const text = `${name} ${description} ${category}`.toLowerCase();
   return Array.from(new Set(text.split(/\W+/).filter(w => w.length > 2)));
}

// Helper to get tenant ID
const getTenantId = (event: APIGatewayProxyEvent): string | null => {
   return event.requestContext?.authorizer?.claims?.['custom:tenant_id'] || event.requestContext?.authorizer?.claims?.sub || null;
};

/**
 * Create Product
 * POST /inventory/{businessId}/products
 */
export const createProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   try {
      const businessId = event.pathParameters?.storeId; // Maps to storeId in path
      const tenantId = getTenantId(event);

      const body = JSON.parse(event.body || '{}');
      const {
         name,
         description,
         price,
         category,
         sku,
         stock_quantity,
         min_stock_level = 5,
         images = [],
         variants = [],
         status = 'active'
      } = body;

      if (!businessId || !tenantId || !name || !price) {
         return response(400, { error: 'Missing required fields' });
      }

      const productId = uuidv4();
      const now = new Date().toISOString();

      const product = {
         tenant_id: tenantId,
         product_id: productId,
         business_id: businessId,
         store_id: businessId, // Alias for query consistency
         name,
         description,
         price: parseFloat(price),
         category,
         sku: sku || `PRD_${productId.slice(0, 8)}`,
         stock_quantity: parseInt(stock_quantity) || 0,
         min_stock_level: parseInt(min_stock_level),
         images,
         variants,
         status,
         is_active: true,
         created_at: now,
         updated_at: now,

         // SEO and search
         search_keywords: generateSearchKeywords(name, description || '', category || ''),

         // Analytics
         views_count: 0,
         orders_count: 0,
         revenue_total: 0
      };

      await dynamoClient.send(new PutCommand({
         TableName: TABLE_NAME,
         Item: product
      }));

      return response(201, {
         success: true,
         product: product
      });

   } catch (error) {
      console.error('Create product error:', error);
      return response(500, { error: 'Failed to create product' });
   }
};

/**
 * Get Products
 * GET /inventory/{storeId}/products
 */
export const getProducts = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   try {
      const storeId = event.pathParameters?.storeId;
      const tenantId = getTenantId(event);

      if (!storeId || !tenantId) return response(400, { error: "Missing ID" });

      const result = await dynamoClient.send(new QueryCommand({
         TableName: TABLE_NAME,
         KeyConditionExpression: 'tenant_id = :tid',
         FilterExpression: 'store_id = :sid AND is_active = :active',
         ExpressionAttributeValues: {
            ':tid': tenantId,
            ':sid': storeId,
            ':active': true
         }
      }));

      return response(200, { success: true, products: result.Items });
   } catch (error) {
      return response(500, { error: 'Failed to fetch products' });
   }
};

/**
 * Update Product
 * PUT /inventory/{storeId}/products/{productId}
 */
export const updateProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   try {
      const storeId = event.pathParameters?.storeId;
      const productId = event.pathParameters?.productId;
      const tenantId = getTenantId(event);
      const body = JSON.parse(event.body || '{}');

      if (!storeId || !productId || !tenantId) {
         return response(400, { error: 'Missing required IDs' });
      }

      // Build update expression...
      // Simplified for reliability:
      await dynamoClient.send(new UpdateCommand({
         TableName: TABLE_NAME,
         Key: { tenant_id: tenantId, product_id: productId },
         UpdateExpression: 'SET #name = :name, price = :price, updated_at = :updated_at',
         ExpressionAttributeNames: { '#name': 'name' },
         ExpressionAttributeValues: {
            ':name': body.name,
            ':price': body.price,
            ':updated_at': new Date().toISOString()
         }
      }));

      return response(200, { success: true, message: 'Product updated' });
   } catch (error) {
      console.error(error);
      return response(500, { error: 'Update failed' });
   }
};

/**
 * Delete Product
 * DELETE /inventory/{storeId}/products/{productId}
 */
export const deleteProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   try {
      const productId = event.pathParameters?.productId;
      const tenantId = getTenantId(event);

      if (!productId || !tenantId) return response(400, { error: "Missing ID" });

      await dynamoClient.send(new UpdateCommand({
         TableName: TABLE_NAME,
         Key: { tenant_id: tenantId, product_id: productId },
         UpdateExpression: "SET is_active = :false",
         ExpressionAttributeValues: { ":false": false }
      }));

      return response(200, { success: true });
   } catch (error) {
      return response(500, { error: "Delete failed" });
   }
};
