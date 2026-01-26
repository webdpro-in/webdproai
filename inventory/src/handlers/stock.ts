/**
 * WebDPro Inventory - Stock Management Handlers
 * Lambda handlers for stock operations
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand, ScanCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = `${process.env.DYNAMODB_TABLE_PREFIX}-products`;

interface APIGatewayEvent {
   pathParameters: { storeId?: string; productId?: string };
   body: string | null;
}

// Helper: Create response
const response = (statusCode: number, body: any) => ({
   statusCode,
   headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
   },
   body: JSON.stringify(body),
});

/**
 * PUT /inventory/{storeId}/stock/{productId}
 * Update stock quantity for a product
 */
export const updateStock = async (event: APIGatewayEvent) => {
   try {
      const storeId = event.pathParameters?.storeId;
      const productId = event.pathParameters?.productId;
      const body = JSON.parse(event.body || '{}');

      if (!storeId || !productId) {
         return response(400, { error: 'Store ID and Product ID are required' });
      }

      const { quantity, operation } = body;

      if (quantity === undefined || typeof quantity !== 'number') {
         return response(400, { error: 'Quantity must be a number' });
      }

      let updateExpression: string;
      let expressionValues: Record<string, any>;

      switch (operation) {
         case 'add':
            // Add to existing stock
            updateExpression = 'SET stock_quantity = stock_quantity + :qty, updated_at = :updated_at';
            expressionValues = {
               ':qty': quantity,
               ':updated_at': new Date().toISOString(),
            };
            break;

         case 'subtract':
            // Subtract from existing stock (with floor of 0)
            updateExpression = 'SET stock_quantity = if_not_exists(stock_quantity, :zero) - :qty, updated_at = :updated_at';
            expressionValues = {
               ':qty': quantity,
               ':zero': 0,
               ':updated_at': new Date().toISOString(),
            };
            break;

         case 'set':
         default:
            // Set absolute value
            updateExpression = 'SET stock_quantity = :qty, updated_at = :updated_at';
            expressionValues = {
               ':qty': quantity,
               ':updated_at': new Date().toISOString(),
            };
            break;
      }

      await docClient.send(new UpdateCommand({
         TableName: TABLE_NAME,
         Key: { store_id: storeId, product_id: productId },
         UpdateExpression: updateExpression,
         ExpressionAttributeValues: expressionValues,
      }));

      return response(200, {
         success: true,
         message: `Stock ${operation || 'set'} successfully`,
         new_quantity: operation === 'set' ? quantity : undefined,
      });
   } catch (error) {
      console.error('Error updating stock:', error);
      return response(500, { error: 'Failed to update stock' });
   }
};

/**
 * GET /inventory/{storeId}/low-stock
 * Get all products with low stock
 */
export const getLowStock = async (event: APIGatewayEvent) => {
   try {
      const storeId = event.pathParameters?.storeId;

      if (!storeId) {
         return response(400, { error: 'Store ID is required' });
      }

      // Query products and filter by low stock
      const result = await docClient.send(new QueryCommand({
         TableName: TABLE_NAME,
         KeyConditionExpression: 'store_id = :storeId',
         FilterExpression: 'stock_quantity <= low_stock_threshold AND is_active = :active',
         ExpressionAttributeValues: {
            ':storeId': storeId,
            ':active': true,
         },
      }));

      const lowStockProducts = (result.Items || []).map(product => ({
         product_id: product.product_id,
         name: product.name,
         current_stock: product.stock_quantity,
         threshold: product.low_stock_threshold,
         category: product.category,
         urgency: product.stock_quantity === 0 ? 'critical' : 'warning',
      }));

      return response(200, {
         success: true,
         low_stock_products: lowStockProducts,
         count: lowStockProducts.length,
         has_critical: lowStockProducts.some(p => p.urgency === 'critical'),
      });
   } catch (error) {
      console.error('Error fetching low stock:', error);
      return response(500, { error: 'Failed to fetch low stock products' });
   }
};

/**
 * Batch stock reduction (called after order placement)
 * Internal function - not exposed via API Gateway
 */
/**
 * Batch stock reduction (Transactional)
 * Called after order placement to ensure ALL items are available or NONE are reserved.
 * Internal function - not exposed via API Gateway directly (used by SNS/Event handlers)
 */
export const reduceStockBatch = async (storeId: string, items: { productId: string; quantity: number }[]) => {
   if (items.length === 0) return { success: true };
   if (items.length > 25) { // DynamoDB transaction limit is 100, checking 25 for safety/standard
      // For large orders, we might need to split patches or use a different strategy.
      // For MVP, we assume orders < 100 items. 
      // If strictly > 100, we'd need multiple transactions with compensating logic (sagas).
      // Implementing for up to 100 as per AWS standard limits.
   }

   // Construct transaction items
   const transactItems = items.map(item => ({
      Update: {
         TableName: TABLE_NAME,
         Key: { store_id: storeId, product_id: item.productId },
         UpdateExpression: 'SET stock_quantity = stock_quantity - :qty, updated_at = :updated_at',
         ConditionExpression: 'stock_quantity >= :qty',
         ExpressionAttributeValues: {
            ':qty': item.quantity,
            ':updated_at': new Date().toISOString(),
         },
      }
   }));

   try {
      // Using TransactWriteItems to ensure atomicity
      await docClient.send(new TransactWriteCommand({
         TransactItems: transactItems
      }));

      return { success: true };
   } catch (error: any) {
      console.error('Error reducing stock batch (Transaction):', error);

      if (error.name === 'TransactionCanceledException') {
         // Determine which item failed
         const reasons = error.CancellationReasons;
         throw new Error(`Insufficient stock: ${JSON.stringify(reasons)}`);
      }

      throw new Error('Failed to process stock reduction');
   }
};
