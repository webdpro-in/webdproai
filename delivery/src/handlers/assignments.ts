/**
 * WebDPro Delivery - Assignment Handlers
 * Assign orders to delivery agents
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(client);

const DELIVERIES_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-deliveries`;
const ORDERS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-orders`;

interface APIGatewayEvent {
   pathParameters: { agentId?: string; orderId?: string };
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
 * GET /delivery/agent/{agentId}/assignments
 * Get all orders assigned to an agent
 */
export const getAssignments = async (event: APIGatewayEvent) => {
   try {
      const agentId = event.pathParameters?.agentId;

      if (!agentId) {
         return response(400, { error: 'Agent ID is required' });
      }

      const result = await docClient.send(new QueryCommand({
         TableName: DELIVERIES_TABLE,
         KeyConditionExpression: 'agent_id = :agentId',
         FilterExpression: '#status IN (:pending, :picked, :transit)',
         ExpressionAttributeNames: {
            '#status': 'status',
         },
         ExpressionAttributeValues: {
            ':agentId': agentId,
            ':pending': 'PENDING',
            ':picked': 'PICKED_UP',
            ':transit': 'IN_TRANSIT',
         },
      }));

      const assignments = (result.Items || []).map(item => ({
         delivery_id: item.delivery_id,
         order_id: item.order_id,
         status: item.status,
         customer_name: item.customer_name,
         customer_phone: item.customer_phone,
         delivery_address: item.delivery_address,
         order_total: item.order_total,
         payment_method: item.payment_method,
         is_cod: item.is_cod,
         created_at: item.created_at,
      }));

      return response(200, {
         success: true,
         assignments,
         count: assignments.length,
      });
   } catch (error) {
      console.error('Error fetching assignments:', error);
      return response(500, { error: 'Failed to fetch assignments' });
   }
};

/**
 * POST /delivery/orders/{orderId}/assign
 * Assign an order to a delivery agent
 */
export const assignOrder = async (event: APIGatewayEvent) => {
   try {
      const orderId = event.pathParameters?.orderId;
      const body = JSON.parse(event.body || '{}');

      if (!orderId) {
         return response(400, { error: 'Order ID is required' });
      }

      const { agent_id, estimated_delivery_time } = body;

      if (!agent_id) {
         return response(400, { error: 'Agent ID is required' });
      }

      // Get order details
      const orderResult = await docClient.send(new GetCommand({
         TableName: ORDERS_TABLE,
         Key: { order_id: orderId },
      }));

      const order = orderResult.Item;
      if (!order) {
         return response(404, { error: 'Order not found' });
      }

      // Create delivery assignment
      const delivery = {
         agent_id,
         delivery_id: uuidv4(),
         order_id: orderId,
         tenant_id: order.tenant_id,
         store_id: order.store_id,
         status: 'PENDING',
         customer_name: order.customer_name,
         customer_phone: order.customer_phone,
         delivery_address: order.delivery_address,
         order_total: order.total_amount,
         payment_method: order.payment_method,
         is_cod: order.payment_method === 'COD',
         cod_amount: order.payment_method === 'COD' ? order.total_amount : 0,
         cod_collected: false,
         estimated_delivery_time: estimated_delivery_time || null,
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString(),
      };

      await docClient.send(new PutCommand({
         TableName: DELIVERIES_TABLE,
         Item: delivery,
      }));

      // Update order status
      await docClient.send(new UpdateCommand({
         TableName: ORDERS_TABLE,
         Key: { order_id: orderId },
         UpdateExpression: 'SET #status = :status, delivery_agent_id = :agentId, updated_at = :time',
         ExpressionAttributeNames: {
            '#status': 'status',
         },
         ExpressionAttributeValues: {
            ':status': 'ASSIGNED_TO_DELIVERY',
            ':agentId': agent_id,
            ':time': new Date().toISOString(),
         },
      }));

      return response(201, {
         success: true,
         message: 'Order assigned to delivery agent',
         delivery_id: delivery.delivery_id,
      });
   } catch (error) {
      console.error('Error assigning order:', error);
      return response(500, { error: 'Failed to assign order' });
   }
};
