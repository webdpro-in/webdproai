import Razorpay from 'razorpay';
import crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX || 'webdpro'}-orders`;
// const PAYMENTS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX || 'webdpro'}-payments`; // Optional for audit

const response = (statusCode: number, body: any) => ({
   statusCode,
   headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
   },
   body: JSON.stringify(body),
});

export const handleWebhook = async (event: any) => {
   try {
      const signature = event.headers['X-Razorpay-Signature'];
      const body = event.body;
      const secret = process.env.WEBHOOK_SECRET;

      if (!secret) {
         console.error('Webhook secret not configured');
         return response(500, { error: 'Configuration error' });
      }

      // 1. Verify Signature
      const expectedSignature = crypto
         .createHmac('sha256', secret)
         .update(body)
         .digest('hex');

      if (signature !== expectedSignature) {
         console.warn('Invalid webhook signature');
         return response(400, { error: 'Invalid signature' });
      }

      const payload = JSON.parse(body);
      const eventType = payload.event;

      console.log(`Received webhook: ${eventType}`);

      if (eventType === 'order.paid') {
         const razorpayOrder = payload.payload.order.entity;
         const razorpayPayment = payload.payload.payment.entity; // The payment details

         // Use receipt as our order_id if mapped correctly
         const orderId = razorpayOrder.receipt;

         if (orderId) {
            console.log(`Updating order ${orderId} to CONFIRMED`);

            await docClient.send(new UpdateCommand({
               TableName: ORDERS_TABLE,
               Key: { order_id: orderId },
               UpdateExpression: 'SET status = :status, payment_id = :pid, payment_method = :pm, paid_at = :now',
               ExpressionAttributeValues: {
                  ':status': 'CONFIRMED', // or PAID
                  ':pid': razorpayPayment.id,
                  ':pm': razorpayPayment.method,
                  ':now': new Date().toISOString()
               }
            }));

            // TODO: Trigger Inventory Reduction asynchronously (SNS or EventBridge)
            // For MVP, handling via DynamoDB Streams on ORDERS_TABLE is a good pattern.
         }
      }

      return response(200, { status: 'ok' });

   } catch (error: any) {
      console.error('Webhook Error:', error);
      return response(500, { error: 'Processing failed' });
   }
};
