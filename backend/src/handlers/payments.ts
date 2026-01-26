/**
 * WebDPro Payment Handler - Dual Flow System
 * 
 * FLOW 1: Customer Orders → Merchant Razorpay Account (Embedded)
 * FLOW 2: WebDPro Subscriptions → Our Razorpay Account (Direct)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_CORE_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Razorpay instances
const webdproRazorpay = new Razorpay({
   key_id: process.env.WEBDPRO_RAZORPAY_KEY_ID!,
   key_secret: process.env.WEBDPRO_RAZORPAY_KEY_SECRET!,
});

// Partner Razorpay for merchant account creation
const partnerRazorpay = new Razorpay({
   key_id: process.env.RAZORPAY_PARTNER_KEY_ID!,
   key_secret: process.env.RAZORPAY_PARTNER_KEY_SECRET!,
});

// Helper: Create response
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
 * MERCHANT PAYMENT SETUP (Embedded Razorpay)
 * POST /merchants/{merchantId}/payments/setup
 */
export const setupMerchantPayments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   try {
      const merchantId = event.pathParameters?.merchantId;
      const body = JSON.parse(event.body || '{}');

      const { businessName, mobile, bankAccount, ifscCode } = body;

      if (!merchantId || !businessName || !mobile || !bankAccount || !ifscCode) {
         return response(400, { error: 'Missing required fields' });
      }

      console.log(`[Payment Setup] Creating Razorpay account for merchant: ${merchantId}`);

      // Create Razorpay account for merchant using Partner API
      // Define the type properly or use any if types are missing
      const razorpayAccount: any = await partnerRazorpay.accounts.create({
         email: `merchant-${merchantId}@webdpro.com`,
         phone: mobile,
         legal_business_name: businessName,
         business_type: 'individual',
         contact_name: businessName,
         profile: {
            category: 'ecommerce',
            subcategory: 'fashion_and_lifestyle'
         }
      });

      // Update merchant record with Razorpay account details
      await dynamoClient.send(new UpdateCommand({
         TableName: 'webdpro-merchants',
         Key: { merchant_id: merchantId },
         UpdateExpression: 'SET razorpay_account_id = :accountId, razorpay_status = :status, payment_enabled = :enabled, bank_account = :bank, ifsc_code = :ifsc, updated_at = :updatedAt',
         ExpressionAttributeValues: {
            ':accountId': razorpayAccount.id,
            ':status': 'pending', // Will be 'active' after KYC
            ':enabled': true,
            ':bank': encrypt(bankAccount), // Encrypt sensitive data
            ':ifsc': ifscCode,
            ':updatedAt': new Date().toISOString()
         }
      }));

      return response(200, {
         success: true,
         message: 'Payment account created successfully',
         account_id: razorpayAccount.id,
         status: 'pending_kyc'
      });

   } catch (error) {
      console.error('Enable payments error:', error);
      return response(500, {
         error: 'Failed to enable payments',
         details: error instanceof Error ? error.message : 'Unknown error'
      });
   }
};

/**
 * Create Order Payment (Customer → Merchant's Account)
 * POST /payments/create-order
 */
export const createOrderPayment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   try {
      const { businessId, orderId, amount, currency = 'INR', customerPhone } = JSON.parse(event.body || '{}');

      if (!businessId || !orderId || !amount) {
         return response(400, { error: 'Missing required fields' });
      }

      // Get business details to find merchant's Razorpay account
      const business = await dynamoClient.send(new GetCommand({
         TableName: 'webdpro-stores',
         Key: { business_id: businessId }
      }));

      if (!business.Item) {
         return response(404, { error: 'Business not found' });
      }

      // Get merchant's Razorpay account
      const merchant = await dynamoClient.send(new GetCommand({
         TableName: 'webdpro-merchants',
         Key: { merchant_id: business.Item.tenant_id }
      }));

      if (!merchant.Item || !merchant.Item.razorpay_account_id) {
         return response(400, { error: 'Merchant payments not enabled' });
      }

      // Create order using merchant's linked account
      const razorpayOrder = await partnerRazorpay.orders.create({
         amount: amount * 100, // Convert to paise
         currency: currency,
         receipt: `order_${orderId}`,
         notes: {
            business_id: businessId,
            order_id: orderId,
            payment_type: 'customer_order',
            customer_phone: customerPhone
         }
      }, {
         // @ts-ignore - Header not in type definition but supported by API
         'X-Razorpay-Account': merchant.Item.razorpay_account_id
      } as any) as any;

      // Verify it's not void
      if (!razorpayOrder) throw new Error("Failed to create order");

      // Store payment record
      await dynamoClient.send(new PutCommand({
         TableName: 'webdpro-payments',
         Item: {
            tenant_id: business.Item.tenant_id,
            payment_id: razorpayOrder.id,
            payment_type: 'customer_order',
            order_id: orderId,
            business_id: businessId,
            customer_amount: amount,
            razorpay_order_id: razorpayOrder.id,
            status: 'created',
            created_at: new Date().toISOString()
         }
      }));

      return response(200, {
         success: true,
         order_id: razorpayOrder.id,
         amount: razorpayOrder.amount,
         currency: razorpayOrder.currency,
         key_id: process.env.RAZORPAY_PARTNER_KEY_ID // Frontend needs this for checkout
      });

   } catch (error) {
      console.error('Create order payment error:', error);
      return response(500, {
         error: 'Failed to create order payment',
         details: error instanceof Error ? error.message : 'Unknown error'
      });
   }
};

/**
 * Create WebDPro Subscription Payment (Merchant → WebDPro's Account)
 * POST /payments/subscription
 */
export const createSubscriptionPayment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   try {
      const { merchantId, plan = 'monthly' } = JSON.parse(event.body || '{}');

      if (!merchantId) {
         return response(400, { error: 'Missing merchant ID' });
      }

      // Subscription pricing
      const subscriptionPlans = {
         monthly: { amount: 999, duration: 30 },
         yearly: { amount: 9999, duration: 365 }
      };

      const selectedPlan = subscriptionPlans[plan as keyof typeof subscriptionPlans];
      if (!selectedPlan) {
         return response(400, { error: 'Invalid subscription plan' });
      }

      // Create order using WebDPro's Razorpay account
      const razorpayOrder = await webdproRazorpay.orders.create({
         amount: selectedPlan.amount * 100, // Convert to paise
         currency: 'INR',
         receipt: `sub_${merchantId}_${Date.now()}`,
         notes: {
            merchant_id: merchantId,
            plan: plan,
            payment_type: 'webdpro_subscription'
         }
      });

      // Store payment record
      await dynamoClient.send(new PutCommand({
         TableName: 'webdpro-payments',
         Item: {
            tenant_id: merchantId,
            payment_id: razorpayOrder.id,
            payment_type: 'webdpro_subscription',
            subscription_plan: plan,
            subscription_amount: selectedPlan.amount,
            razorpay_order_id: razorpayOrder.id,
            status: 'created',
            created_at: new Date().toISOString()
         }
      }));

      return response(200, {
         success: true,
         order_id: razorpayOrder.id,
         amount: razorpayOrder.amount,
         currency: razorpayOrder.currency,
         key_id: process.env.WEBDPRO_RAZORPAY_KEY_ID, // WebDPro's key for subscription
         plan: plan,
         duration_days: selectedPlan.duration
      });

   } catch (error) {
      console.error('Create subscription payment error:', error);
      return response(500, {
         error: 'Failed to create subscription payment',
         details: error instanceof Error ? error.message : 'Unknown error'
      });
   }
};

/**
 * Payment Webhook Handler (Both Order and Subscription Payments)
 * POST /payments/webhook
 */
export const handleWebhook = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   try {
      const webhookSignature = event.headers['x-razorpay-signature'];
      const webhookBody = event.body;

      if (!webhookSignature || !webhookBody) {
         return response(400, { error: 'Missing webhook signature or body' });
      }

      // Verify webhook signature
      const expectedSignature = crypto
         .createHmac('sha256', process.env.RAZORPAY_PARTNER_WEBHOOK_SECRET!)
         .update(webhookBody)
         .digest('hex');

      if (webhookSignature !== expectedSignature) {
         return response(400, { error: 'Invalid webhook signature' });
      }

      const webhookData = JSON.parse(webhookBody);
      const { event: eventType, payload } = webhookData;

      if (eventType === 'payment.captured') {
         const payment = payload.payment.entity;
         const paymentType = payment.notes?.payment_type;

         if (paymentType === 'customer_order') {
            await handleOrderPaymentSuccess(payment);
         } else if (paymentType === 'webdpro_subscription') {
            await handleSubscriptionPaymentSuccess(payment);
         }
      }

      return response(200, { success: true });

   } catch (error) {
      console.error('Webhook error:', error);
      return response(500, {
         error: 'Webhook processing failed',
         details: error instanceof Error ? error.message : 'Unknown error'
      });
   }
};

/**
 * Handle successful order payment
 */
async function handleOrderPaymentSuccess(payment: any) {
   const { order_id, business_id } = payment.notes;

   // Update payment record
   await dynamoClient.send(new UpdateCommand({
      TableName: 'webdpro-payments',
      Key: {
         tenant_id: payment.notes.merchant_id || 'unknown',
         payment_id: payment.order_id
      },
      UpdateExpression: 'SET #status = :status, razorpay_payment_id = :paymentId, method = :method, updated_at = :updatedAt',
      ExpressionAttributeNames: {
         '#status': 'status'
      },
      ExpressionAttributeValues: {
         ':status': 'captured',
         ':paymentId': payment.id,
         ':method': payment.method,
         ':updatedAt': new Date().toISOString()
      }
   }));

   // Update order status
   await dynamoClient.send(new UpdateCommand({
      TableName: 'webdpro-orders',
      Key: {
         tenant_id: payment.notes.merchant_id || 'unknown',
         order_id: order_id
      },
      UpdateExpression: 'SET payment_status = :status, payment_id = :paymentId, updated_at = :updatedAt',
      ExpressionAttributeValues: {
         ':status': 'paid',
         ':paymentId': payment.id,
         ':updatedAt': new Date().toISOString()
      }
   }));

   // TODO: Trigger inventory reduction
   // TODO: Send confirmation to customer
   // TODO: Notify merchant
}

/**
 * Handle successful subscription payment
 */
async function handleSubscriptionPaymentSuccess(payment: any) {
   const { merchant_id, plan } = payment.notes;

   const planDurations = {
      monthly: 30,
      yearly: 365
   };

   const duration = planDurations[plan as keyof typeof planDurations] || 30;
   const expiresAt = new Date();
   expiresAt.setDate(expiresAt.getDate() + duration);

   // Update merchant subscription
   await dynamoClient.send(new UpdateCommand({
      TableName: 'webdpro-merchants',
      Key: { merchant_id: merchant_id },
      UpdateExpression: 'SET subscription_status = :status, subscription_plan = :plan, subscription_expires_at = :expiresAt, updated_at = :updatedAt',
      ExpressionAttributeValues: {
         ':status': 'active',
         ':plan': plan,
         ':expiresAt': expiresAt.toISOString(),
         ':updatedAt': new Date().toISOString()
      }
   }));

   // Update payment record
   await dynamoClient.send(new UpdateCommand({
      TableName: 'webdpro-payments',
      Key: {
         tenant_id: merchant_id,
         payment_id: payment.order_id
      },
      UpdateExpression: 'SET #status = :status, razorpay_payment_id = :paymentId, method = :method, updated_at = :updatedAt',
      ExpressionAttributeNames: {
         '#status': 'status'
      },
      ExpressionAttributeValues: {
         ':status': 'captured',
         ':paymentId': payment.id,
         ':method': payment.method,
         ':updatedAt': new Date().toISOString()
      }
   }));

   // TODO: Send subscription confirmation email
   // TODO: Update merchant dashboard access
}

/**
 * Simple encryption for sensitive data (use proper encryption in production)
 */
function encrypt(text: string): string {
   // In production, use AWS KMS or proper encryption
   return Buffer.from(text).toString('base64');
}

/**
 * Get Payment Status
 * GET /payments/{paymentId}/status
 */
export const getPaymentStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   try {
      const paymentId = event.pathParameters?.paymentId;
      const merchantId = event.requestContext.authorizer?.claims?.sub; // From Cognito

      if (!paymentId || !merchantId) {
         return response(400, { error: 'Missing payment ID or merchant ID' });
      }

      const payment = await dynamoClient.send(new GetCommand({
         TableName: 'webdpro-payments',
         Key: {
            tenant_id: merchantId,
            payment_id: paymentId
         }
      }));

      if (!payment.Item) {
         return response(404, { error: 'Payment not found' });
      }

      return response(200, {
         success: true,
         payment: payment.Item
      });

   } catch (error) {
      console.error('Get payment status error:', error);
      return response(500, {
         error: 'Failed to get payment status',
         details: error instanceof Error ? error.message : 'Unknown error'
      });
   }
};