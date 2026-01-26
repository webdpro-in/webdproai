/**
 * WebDPro Inventory Service - Products Handler
 * Central inventory management for all merchant businesses
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

const response = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify(body),
});

/**
 * Create Product
 * POST /inventory/{businessId}/products
 */
export const createProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const businessId = event.pathParameters?.businessId;
    const merchantId = event.requestContext.authorizer?.claims?.sub; // From Cognito
    
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
    } = JSON.parse(event.body || '{}');

    if (!businessId || !merchantId || !name || !price) {
      return response(400, { error: 'Missing required fields' });
    }

    // Verify business belongs to merchant
    const business = await dynamoClient.send(new GetCommand({
      TableName: 'webdpro-stores',
      Key: { 
        tenant_id: merchantId,
        store_id: businessId 
      }
    }));

    if (!business.Item) {
      return response(403, { error: 'Business not found or access denied' });
    }

    const productId = uuidv4();
    const now = new Date().toISOString();

    const product = {
      tenant_id: merchantId,
      product_id: productId,
      business_id: businessId,
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
      created_at: now,
      updated_at: now,
      
      // SEO and search
      search_keywords: generateSearchKeywords(name, description, category),
      
      // Analytics
      views_count: 0,
      orders_count: 0,
      revenue_total: 0
    };

    await dynamoClient.send(new PutCommand({
      TableName: 'webdpro-products',
      Item: product
    }));

    return response(201, {
      success: true,
      product: product
    });

  } catch (error) {
    console.error('CrON.parse(event.body || '{}');

      if (!storeId) {
         return response(400, { error: 'Store ID is required' });
      }

      if (!tenantId) {
         return response(401, { error: 'Unauthorized - tenant not found' });
      }

      // Validate required fields
      const requiredFields = ['name', 'price', 'category'];
      for (const field of requiredFields) {
         if (!body[field]) {
            return response(400, { error: `${field} is required` });
         }
      }

      const product: Product = {
         tenant_id: tenantId,
         product_id: uuidv4(),
         store_id: storeId,
         name: body.name,
         description: body.description || '',
         price: parseFloat(body.price),
         currency: body.currency || 'INR',
         category: body.category,
         images: body.images || [],
         stock_quantity: parseInt(body.stock_quantity) || 0,
         low_stock_threshold: parseInt(body.low_stock_threshold) || 10,
         is_active: body.is_active !== false,
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString(),
      };

      await docClient.send(new PutCommand({
         TableName: TABLE_NAME,
         Item: product,
      }));

      return response(201, {
         success: true,
         message: 'Product created successfully',
         product,
      });
   } catch (error) {
      console.error('Error creating product:', error);
      return response(500, { error: 'Failed to create product' });
   }
};

/**
 * PUT /inventory/{storeId}/products/{productId}
 * Update an existing product
 */
export const updateProduct = async (event: APIGatewayEvent) => {
   try {
      const storeId = event.pathParameters?.storeId;
      const productId = event.pathParameters?.productId;
      const tenantId = getTenantId(event);
      const body = JSON.parse(event.body || '{}');

      if (!storeId || !productId) {
         return response(400, { error: 'Store ID and Product ID are required' });
      }

      if (!tenantId) {
         return response(401, { error: 'Unauthorized - tenant not found' });
      }

      // Build update expression dynamically
      const updateFields: string[] = [];
      const expressionValues: Record<string, any> = {};
      const expressionNames: Record<string, string> = {};

      const allowedFields = ['name', 'description', 'price', 'category', 'images', 'stock_quantity', 'low_stock_threshold', 'is_active'];

      for (const field of allowedFields) {
         if (body[field] !== undefined) {
            updateFields.push(`#${field} = :${field}`);
            expressionValues[`:${field}`] = body[field];
            expressionNames[`#${field}`] = field;
         }
      }

      // Always update timestamp
      updateFields.push('#updated_at = :updated_at');
      expressionValues[':updated_at'] = new Date().toISOString();
      expressionNames['#updated_at'] = 'updated_at';

      await docClient.send(new UpdateCommand({
         TableName: TABLE_NAME,
         Key: { tenant_id: tenantId, product_id: productId },
         UpdateExpression: `SET ${updateFields.join(', ')}`,
         ExpressionAttributeValues: expressionValues,
         ExpressionAttributeNames: expressionNames,
         ConditionExpression: 'store_id = :storeId',
         ExpressionAttributeValues: {
            ...expressionValues,
            ':storeId': storeId,
         },
      }));

      return response(200, {
         success: true,
         message: 'Product updated successfully',
      });
   } catch (error) {
      console.error('Error updating product:', error);
      return response(500, { error: 'Failed to update product' });
   }
};

/**
 * DELETE /inventory/{storeId}/products/{productId}
 * Delete a product (soft delete by setting is_active = false)
 */
export const deleteProduct = async (event: APIGatewayEvent) => {
   try {
      const storeId = event.pathParameters?.storeId;
      const productId = event.pathParameters?.productId;
      const tenantId = getTenantId(event);

      if (!storeId || !productId) {
         return response(400, { error: 'Store ID and Product ID are required' });
      }

      if (!tenantId) {
         return response(401, { error: 'Unauthorized - tenant not found' });
      }

      // Soft delete - mark as inactive
      await docClient.send(new UpdateCommand({
         TableName: TABLE_NAME,
         Key: { tenant_id: tenantId, product_id: productId },
         UpdateExpression: 'SET is_active = :inactive, updated_at = :updated_at',
         ExpressionAttributeValues: {
            ':inactive': false,
            ':updated_at': new Date().toISOString(),
            ':storeId': storeId,
         },
         ConditionExpression: 'store_id = :storeId',
      }));

      return response(200, {
         success: true,
         message: 'Product deleted successfully',
      });
   } catch (error) {
      console.error('Error deleting product:', error);
      return response(500, { error: 'Failed to delete product' });
   }
};
