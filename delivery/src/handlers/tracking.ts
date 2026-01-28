/**
 * WebDPro Delivery - Tracking Handlers
 * Real-time delivery tracking and status updates
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'eu-north-1' });

const DELIVERIES_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-deliveries`;
const ORDERS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-orders`;

// Valid status transitions
const STATUS_FLOW = {
   PENDING: ['PICKED_UP'],
   PICKED_UP: ['IN_TRANSIT'],
   IN_TRANSIT: ['DELIVERED', 'FAILED'],
   DELIVERED: [] as string[],
   FAILED: ['PENDING'], // Can retry
};

interface APIGatewayEvent {
   pathParameters: { deliveryId?: string };
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
 * PUT /delivery/{deliveryId}/status
 * Update delivery status
 */
export const updateStatus = async (event: APIGatewayEvent) => {
   try {
      const deliveryId = event.pathParameters?.deliveryId;
      const body = JSON.parse(event.body || '{}');

      if (!deliveryId) {
         return response(400, { error: 'Delivery ID is required' });
      }

      const { status, location, notes } = body;

      if (!status) {
         return response(400, { error: 'Status is required' });
      }

      // Get current delivery
      const deliveryResult = await docClient.send(new GetCommand({
         TableName: DELIVERIES_TABLE,
         Key: { delivery_id: deliveryId },
      }));

      const delivery = deliveryResult.Item;
      if (!delivery) {
         return response(404, { error: 'Delivery not found' });
      }

      // Validate status transition
      const currentStatus = delivery.status as keyof typeof STATUS_FLOW;
      const allowedStatuses = STATUS_FLOW[currentStatus] || [];

      if (!allowedStatuses.includes(status)) {
         return response(400, {
            error: `Invalid status transition from ${currentStatus} to ${status}`,
            allowed_statuses: allowedStatuses,
         });
      }

      // Build update
      const updateExpressions = ['#status = :status', 'updated_at = :time'];
      const expressionValues: Record<string, any> = {
         ':status': status,
         ':time': new Date().toISOString(),
      };
      const expressionNames: Record<string, string> = {
         '#status': 'status',
      };

      // Add location if provided
      if (location) {
         updateExpressions.push('last_location = :location');
         expressionValues[':location'] = location;
      }

      // Add notes if provided
      if (notes) {
         updateExpressions.push('notes = list_append(if_not_exists(notes, :empty), :notes)');
         expressionValues[':notes'] = [{
            text: notes,
            timestamp: new Date().toISOString(),
         }];
         expressionValues[':empty'] = [];
      }

      // Add timestamp for specific statuses
      if (status === 'PICKED_UP') {
         updateExpressions.push('picked_up_at = :time');
      } else if (status === 'DELIVERED') {
         updateExpressions.push('delivered_at = :time');
      }

      await docClient.send(new UpdateCommand({
         TableName: DELIVERIES_TABLE,
         Key: { delivery_id: deliveryId },
         UpdateExpression: `SET ${updateExpressions.join(', ')}`,
         ExpressionAttributeValues: expressionValues,
         ExpressionAttributeNames: expressionNames,
      }));

      // Update parent order status
      const orderStatus = status === 'DELIVERED' ? 'DELIVERED' :
         status === 'FAILED' ? 'DELIVERY_FAILED' :
            'OUT_FOR_DELIVERY';

      await docClient.send(new UpdateCommand({
         TableName: ORDERS_TABLE,
         Key: { order_id: delivery.order_id },
         UpdateExpression: 'SET #status = :status, updated_at = :time',
         ExpressionAttributeNames: { '#status': 'status' },
         ExpressionAttributeValues: {
            ':status': orderStatus,
            ':time': new Date().toISOString(),
         },
      }));

      // Send SMS notification to customer (if SNS topic configured)
      if (status === 'PICKED_UP' || status === 'DELIVERED') {
         try {
            await sendCustomerNotification(delivery.customer_phone, status, delivery);
         } catch (snsError) {
            console.error('Failed to send SMS:', snsError);
         }
      }

      return response(200, {
         success: true,
         message: `Delivery status updated to ${status}`,
         delivery_id: deliveryId,
         new_status: status,
      });
   } catch (error) {
      console.error('Error updating status:', error);
      return response(500, { error: 'Failed to update delivery status' });
   }
};

/**
 * GET /delivery/{deliveryId}/tracking
 * Get delivery tracking info for customers
 */
export const getTracking = async (event: APIGatewayEvent) => {
   try {
      const deliveryId = event.pathParameters?.deliveryId;

      if (!deliveryId) {
         return response(400, { error: 'Delivery ID is required' });
      }

      const result = await docClient.send(new GetCommand({
         TableName: DELIVERIES_TABLE,
         Key: { delivery_id: deliveryId },
      }));

      const delivery = result.Item;
      if (!delivery) {
         return response(404, { error: 'Delivery not found' });
      }

      // Return customer-friendly tracking info
      return response(200, {
         success: true,
         tracking: {
            delivery_id: delivery.delivery_id,
            order_id: delivery.order_id,
            status: delivery.status,
            status_message: getStatusMessage(delivery.status),
            estimated_delivery: delivery.estimated_delivery_time,
            picked_up_at: delivery.picked_up_at,
            delivered_at: delivery.delivered_at,
            last_location: delivery.last_location,
            updates: (delivery.notes || []).map((n: any) => ({
               message: n.text,
               time: n.timestamp,
            })),
         },
      });
   } catch (error) {
      console.error('Error fetching tracking:', error);
      return response(500, { error: 'Failed to fetch tracking info' });
   }
};

/**
 * Get user-friendly status message
 */
function getStatusMessage(status: string): string {
   const messages: Record<string, string> = {
      PENDING: 'Order is ready for pickup',
      PICKED_UP: 'Order has been picked up by delivery agent',
      IN_TRANSIT: 'Order is on the way to you',
      DELIVERED: 'Order has been delivered',
      FAILED: 'Delivery attempt failed',
   };
   return messages[status] || 'Status unknown';
}

/**
 * Send SMS notification to customer
 */
async function sendCustomerNotification(phone: string, status: string, delivery: any): Promise<void> {
   const messages: Record<string, string> = {
      PICKED_UP: `Your order from ${delivery.store_id} has been picked up and is on its way!`,
      DELIVERED: `Your order has been delivered. Thank you for shopping with us!`,
   };

   const message = messages[status];
   if (!message || !phone) return;

   // Note: In production, configure SNS topic ARN
   // await snsClient.send(new PublishCommand({
   //   PhoneNumber: phone,
   //   Message: message,
   // }));

   console.log(`SMS would be sent to ${phone}: ${message}`);
}
