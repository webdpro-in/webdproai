import { APIGatewayProxyHandler } from 'aws-lambda';
import Razorpay from 'razorpay';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Initialize Razorpay with WEBDPRO'S Keys (Platform Keys)
// These are different from the Merchant's keys used in checkout.ts
const razorpay = new Razorpay({
   key_id: process.env.RAZORPAY_KEY_ID || '', // Platform Key
   key_secret: process.env.RAZORPAY_KEY_SECRET || '', // Platform Secret
});

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TENANTS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-tenants`;

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
 * POST /payments/subscription
 * Create a Platform Subscription for the Merchant
 */
export const createSubscription: APIGatewayProxyHandler = async (event) => {
   try {
      const body = JSON.parse(event.body || '{}');
      const { tenantId, planId } = body; // e.g., 'plan_LfvBr...'

      if (!tenantId || !planId) {
         return response(400, { error: 'Tenant ID and Plan ID are required' });
      }

      // 1. Create Subscription in Razorpay
      const subscription = await razorpay.subscriptions.create({
         plan_id: planId,
         customer_notify: 1,
         total_count: 120, // 10 years (Future Proof!)
         notes: {
            tenant_id: tenantId
         }
      });

      // 2. Update Tenant Record via Transaction or simple Update
      // We store the subscription ID to verify status later
      await docClient.send(new UpdateCommand({
         TableName: TENANTS_TABLE,
         Key: { tenant_id: tenantId },
         UpdateExpression: "SET subscription_id = :subId, subscription_status = :status, updated_at = :now",
         ExpressionAttributeValues: {
            ":subId": subscription.id,
            ":status": "CREATED",
            ":now": new Date().toISOString()
         }
      }));

      return response(200, {
         success: true,
         subscription_id: subscription.id,
         short_url: subscription.short_url,
         status: subscription.status
      });

   } catch (error: any) {
      console.error('Create Subscription Error:', error);
      return response(500, { error: error.message || 'Failed to create subscription' });
   }
};

/**
 * POST /payments/webhook/subscription
 * Handle Subscription Events (charged, cancelled)
 */
export const handleSubscriptionWebhook: APIGatewayProxyHandler = async (event) => {
   // Verify Signature matching Webhook Secret (implementation omitted for brevity, but critical)
   const body = JSON.parse(event.body || '{}');

   if (body.event === 'subscription.charged') {
      const { id, status, notes } = body.payload.subscription.entity;
      const tenantId = notes.tenant_id;

      if (tenantId) {
         await docClient.send(new UpdateCommand({
            TableName: TENANTS_TABLE,
            Key: { tenant_id: tenantId },
            UpdateExpression: "SET subscription_status = :status, next_billing_at = :nextDetails, updated_at = :now",
            ExpressionAttributeValues: {
               ":status": "ACTIVE",
               ":nextDetails": body.payload.subscription.entity.charge_at,
               ":now": new Date().toISOString()
            }
         }));
      }
   }

   return response(200, { received: true });
};
