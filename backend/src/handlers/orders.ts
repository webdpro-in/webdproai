/**
 * WebDPro Backend - Order Management Handlers
 * Handle order creation, updates, and status tracking
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'eu-north-1' });

const ORDERS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-orders`;
const STORES_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-stores`;
const EVENTS_TOPIC_ARN = process.env.EVENTS_TOPIC_ARN;

interface APIGatewayEvent {
   pathParameters?: { orderId?: string; storeId?: string };
   body: string | null;
   requestContext?: { authorizer?: { claims?: { 'custom:tenant_id'?: string } } };
}

const response = (statusCode: number, body: any) => ({
   statusCode,
   headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
   },
   body: JSON.stringify(body),
});

const getTenantId = (event: APIGatewayEvent): string | null => {
   return event.requestContext?.authorizer?.claims?.['custom:tenant_id'] || null;
};

/**
 * POST /stores/{storeId}/orders
 * Create new order
 */
export const createOrder = async (event: APIGatewayEvent) => {
   try {
      const storeId = event.pathParameters?.storeId;
      const body = JSON.parse(event.body || '{}');
      const { customer, items, delivery_address, payment_method = 'COD' } = body;

      if (!storeId || !customer || !items || !Array.isArray(items) || items.length === 0) {
         return response(400, { error: 'Missing required fields: customer, items' });
      }

      // Get store to validate and get tenant_id
      const storeResult = await docClient.send(new GetCommand({
         TableName: STORES_TABLE,
         Key: { store_id: storeId },
      }));

      const store = storeResult.Item;
      if (!store) {
         return response(404, { error: 'Store not found' });
      }

      if (store.status !== 'PUBLISHED') {
         return response(400, { error: 'Store is not accepting orders' });
      }

      // Calculate totals
      let subtotal = 0;
      const processedItems = items.map((item: any) => {
         const itemTotal = item.price * item.quantity;
         subtotal += itemTotal;
         return {
            product_id: item.product_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: itemTotal,
         };
      });

      const deliveryFee = payment_method === 'COD' ? 15 : 0; // COD fee
      const totalAmount = subtotal + deliveryFee;

      const orderId = uuidv4();
      const createdAt = new Date().toISOString();

      // Create order
      const order = {
         order_id: orderId,
         store_id: storeId,
         tenant_id: store.tenant_id,
         customer: {
            name: customer.name,
            phone: customer.phone,
            email: customer.email || null,
         },
         items: processedItems,
         subtotal,
         delivery_fee: deliveryFee,
         total_amount: totalAmount,
         delivery_address,
         payment_method,
         status: 'PENDING_PAYMENT',
         payment_status: 'PENDING',
         created_at: createdAt,
         updated_at: createdAt,
      };

      await docClient.send(new PutCommand({
         TableName: ORDERS_TABLE,
         Item: order,
      }));

      // Publish ORDER_CREATED event
      await publishEvent('ORDER_CREATED', {
         orderId,
         storeId,
         tenantId: store.tenant_id,
         totalAmount,
         paymentMethod: payment_method,
         itemCount: items.length,
      });

      return response(201, {
         success: true,
         message: 'Order created successfully',
         order: {
            order_id: orderId,
            status: 'PENDING_PAYMENT',
            total_amount: totalAmount,
            payment_method,
         },
      });
   } catch (error: any) {
      console.error('Error creating order:', error);
      return response(500, { error: error.message || 'Failed to create order' });
   }
};

/**
 * GET /orders/{orderId}
 * Get order details
 */
export const getOrder = async (event: APIGatewayEvent) => {
   try {
      const orderId = event.pathParameters?.orderId;

      if (!orderId) {
         return response(400, { error: 'Order ID required' });
      }

      const result = await docClient.send(new GetCommand({
         TableName: ORDERS_TABLE,
         Key: { order_id: orderId },
      }));

      if (!result.Item) {
         return response(404, { error: 'Order not found' });
      }

      return response(200, {
         success: true,
         order: result.Item,
      });
   } catch (error: any) {
      console.error('Error fetching order:', error);
      return response(500, { error: 'Failed to fetch order' });
   }
};

/**
 * GET /stores/{storeId}/orders
 * Get orders for store
 */
export const getStoreOrders = async (event: APIGatewayEvent) => {
   try {
      const tenantId = getTenantId(event);
      const storeId = event.pathParameters?.storeId;

      if (!tenantId || !storeId) {
         return response(400, { error: 'Store ID required' });
      }

      // Use GSI to query by tenant_id
      const result = await docClient.send(new QueryCommand({
         TableName: ORDERS_TABLE,
         IndexName: 'tenant-index',
         KeyConditionExpression: 'tenant_id = :tenantId',
         FilterExpression: 'store_id = :storeId',
         ExpressionAttributeValues: {
            ':tenantId': tenantId,
            ':storeId': storeId,
         },
         ScanIndexForward: false, // Latest first
      }));

      return response(200, {
         success: true,
         orders: result.Items || [],
         count: result.Count || 0,
      });
   } catch (error: any) {
      console.error('Error fetching store orders:', error);
      return response(500, { error: 'Failed to fetch orders' });
   }
};

/**
 * PUT /orders/{orderId}/status
 * Update order status
 */
export const updateOrderStatus = async (event: APIGatewayEvent) => {
   try {
      const orderId = event.pathParameters?.orderId;
      const body = JSON.parse(event.body || '{}');
      const { status, payment_status, notes } = body;

      if (!orderId || !status) {
         return response(400, { error: 'Order ID and status required' });
      }

      const validStatuses = ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
         return response(400, { error: 'Invalid status' });
      }

      // Build update expression
      const updateExpressions: string[] = ['#status = :status', 'updated_at = :time'];
      const expressionValues: Record<string, any> = {
         ':status': status,
         ':time': new Date().toISOString(),
      };
      const expressionNames: Record<string, string> = {
         '#status': 'status',
      };

      if (payment_status) {
         updateExpressions.push('payment_status = :paymentStatus');
         expressionValues[':paymentStatus'] = payment_status;
      }

      if (notes) {
         updateExpressions.push('notes = :notes');
         expressionValues[':notes'] = notes;
      }

      await docClient.send(new UpdateCommand({
         TableName: ORDERS_TABLE,
         Key: { order_id: orderId },
         UpdateExpression: `SET ${updateExpressions.join(', ')}`,
         ExpressionAttributeValues: expressionValues,
         ExpressionAttributeNames: expressionNames,
      }));

      // Publish status update event
      await publishEvent('ORDER_STATUS_UPDATED', {
         orderId,
         status,
         paymentStatus: payment_status,
         updatedAt: new Date().toISOString(),
      });

      return response(200, {
         success: true,
         message: 'Order status updated successfully',
      });
   } catch (error: any) {
      console.error('Error updating order status:', error);
      return response(500, { error: error.message || 'Failed to update order status' });
   }
};

// Helper: Publish event to SNS
async function publishEvent(eventType: string, data: any): Promise<void> {
   if (!EVENTS_TOPIC_ARN) {
      console.warn('EVENTS_TOPIC_ARN not configured, skipping event publication');
      return;
   }

   try {
      await snsClient.send(new PublishCommand({
         TopicArn: EVENTS_TOPIC_ARN,
         Message: JSON.stringify({
            eventType,
            timestamp: new Date().toISOString(),
            data
         }),
         MessageAttributes: {
            eventType: {
               DataType: 'String',
               StringValue: eventType
            }
         }
      }));
      console.log(`Published ${eventType} event`);
   } catch (error) {
      console.error(`Failed to publish ${eventType} event:`, error);
   }
}