/**
 * WebDPro Delivery - Cash on Delivery (COD) Handlers
 * Manage cash collection and reconciliation
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(client);

const DELIVERIES_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-deliveries`;
const PAYMENTS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-payments`;

interface APIGatewayEvent {
   pathParameters: { deliveryId?: string; agentId?: string };
   body: string | null;
   queryStringParameters?: { date?: string };
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
 * POST /delivery/{deliveryId}/cash
 * Record cash collection for a COD delivery
 */
export const recordCashCollection = async (event: APIGatewayEvent) => {
   try {
      const deliveryId = event.pathParameters?.deliveryId;
      const body = JSON.parse(event.body || '{}');

      if (!deliveryId) {
         return response(400, { error: 'Delivery ID is required' });
      }

      const { amount_collected, notes } = body;

      if (amount_collected === undefined) {
         return response(400, { error: 'Amount collected is required' });
      }

      // Get delivery
      const deliveryResult = await docClient.send(new GetCommand({
         TableName: DELIVERIES_TABLE,
         Key: { delivery_id: deliveryId },
      }));

      const delivery = deliveryResult.Item;
      if (!delivery) {
         return response(404, { error: 'Delivery not found' });
      }

      if (!delivery.is_cod) {
         return response(400, { error: 'This is not a COD delivery' });
      }

      if (delivery.cod_collected) {
         return response(400, { error: 'Cash already collected for this delivery' });
      }

      const expectedAmount = delivery.cod_amount;
      const variance = amount_collected - expectedAmount;

      // Update delivery with cash collection
      await docClient.send(new UpdateCommand({
         TableName: DELIVERIES_TABLE,
         Key: { delivery_id: deliveryId },
         UpdateExpression: `SET 
        cod_collected = :true, 
        cod_collected_amount = :amount, 
        cod_variance = :variance,
        cod_collected_at = :time,
        cod_notes = :notes,
        updated_at = :time`,
         ExpressionAttributeValues: {
            ':true': true,
            ':amount': amount_collected,
            ':variance': variance,
            ':time': new Date().toISOString(),
            ':notes': notes || null,
         },
      }));

      // Create payment record
      await docClient.send(new UpdateCommand({
         TableName: PAYMENTS_TABLE,
         Key: {
            tenant_id: delivery.tenant_id,
            payment_id: `COD-${deliveryId}`,
         },
         UpdateExpression: `SET 
        order_id = :orderId,
        store_id = :storeId,
        amount = :amount,
        expected_amount = :expected,
        variance = :variance,
        payment_method = :method,
        collected_by = :agent,
        collected_at = :time,
        #status = :status`,
         ExpressionAttributeNames: {
            '#status': 'status',
         },
         ExpressionAttributeValues: {
            ':orderId': delivery.order_id,
            ':storeId': delivery.store_id,
            ':amount': amount_collected,
            ':expected': expectedAmount,
            ':variance': variance,
            ':method': 'COD',
            ':agent': delivery.agent_id,
            ':time': new Date().toISOString(),
            ':status': variance === 0 ? 'MATCHED' : 'VARIANCE',
         },
      }));

      return response(200, {
         success: true,
         message: 'Cash collection recorded',
         details: {
            delivery_id: deliveryId,
            expected_amount: expectedAmount,
            collected_amount: amount_collected,
            variance: variance,
            status: variance === 0 ? 'MATCHED' : variance > 0 ? 'OVER_COLLECTED' : 'SHORT',
         },
      });
   } catch (error) {
      console.error('Error recording cash:', error);
      return response(500, { error: 'Failed to record cash collection' });
   }
};

/**
 * GET /delivery/agent/{agentId}/cash-summary
 * Get cash collection summary for an agent (daily)
 */
export const getCashSummary = async (event: APIGatewayEvent) => {
   try {
      const agentId = event.pathParameters?.agentId;
      const date = event.queryStringParameters?.date || new Date().toISOString().split('T')[0];

      if (!agentId) {
         return response(400, { error: 'Agent ID is required' });
      }

      // Get all COD deliveries for the agent on the specified date
      const result = await docClient.send(new QueryCommand({
         TableName: DELIVERIES_TABLE,
         KeyConditionExpression: 'agent_id = :agentId',
         FilterExpression: 'is_cod = :true AND begins_with(cod_collected_at, :date)',
         ExpressionAttributeValues: {
            ':agentId': agentId,
            ':true': true,
            ':date': date,
         },
      }));

      const deliveries = result.Items || [];

      // Calculate summary
      const summary = {
         date,
         agent_id: agentId,
         total_deliveries: deliveries.length,
         total_expected: 0,
         total_collected: 0,
         total_variance: 0,
         pending_collection: 0,
         deliveries: [] as any[],
      };

      for (const delivery of deliveries) {
         if (delivery.cod_collected) {
            summary.total_expected += delivery.cod_amount || 0;
            summary.total_collected += delivery.cod_collected_amount || 0;
            summary.total_variance += delivery.cod_variance || 0;

            summary.deliveries.push({
               delivery_id: delivery.delivery_id,
               order_id: delivery.order_id,
               expected: delivery.cod_amount,
               collected: delivery.cod_collected_amount,
               variance: delivery.cod_variance,
               collected_at: delivery.cod_collected_at,
            });
         } else if (delivery.is_cod && delivery.status === 'DELIVERED') {
            summary.pending_collection += delivery.cod_amount || 0;
         }
      }

      // Get pending (not yet delivered) COD orders
      const pendingResult = await docClient.send(new QueryCommand({
         TableName: DELIVERIES_TABLE,
         KeyConditionExpression: 'agent_id = :agentId',
         FilterExpression: 'is_cod = :true AND #status IN (:pending, :picked, :transit)',
         ExpressionAttributeNames: {
            '#status': 'status',
         },
         ExpressionAttributeValues: {
            ':agentId': agentId,
            ':true': true,
            ':pending': 'PENDING',
            ':picked': 'PICKED_UP',
            ':transit': 'IN_TRANSIT',
         },
      }));

      const pendingCOD = (pendingResult.Items || []).reduce((sum, d) => sum + (d.cod_amount || 0), 0);

      return response(200, {
         success: true,
         summary: {
            ...summary,
            upcoming_cod: pendingCOD,
            net_position: summary.total_collected - summary.total_expected,
         },
      });
   } catch (error) {
      console.error('Error getting cash summary:', error);
      return response(500, { error: 'Failed to get cash summary' });
   }
};
