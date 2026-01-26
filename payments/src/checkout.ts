import Razorpay from 'razorpay';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX || 'webdpro'}-orders`;
const TENANTS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX || 'webdpro'}-tenants`;

const razorpay = new Razorpay({
   key_id: process.env.RAZORPAY_KEY_ID || 'dummy',
   key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy',
});

const response = (statusCode: number, body: any) => ({
   statusCode,
   headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
   },
   body: JSON.stringify(body),
});

export const createStoreOrder = async (event: any) => {
   try {
      const body = JSON.parse(event.body || '{}');
      const { order_id } = body;

      if (!order_id) {
         return response(400, { error: 'Order ID is required' });
      }

      // 1. Fetch Order Details
      const orderResult = await docClient.send(new GetCommand({
         TableName: ORDERS_TABLE,
         Key: { order_id }
      }));

      const order = orderResult.Item;
      if (!order) {
         return response(404, { error: 'Order not found' });
      }

      if (order.status !== 'PENDING_PAYMENT') {
         return response(400, { error: 'Order is not in pending state' });
      }

      // 2. Fetch Merchant's Razorpay Credentials
      const tenantResult = await docClient.send(new GetCommand({
         TableName: TENANTS_TABLE,
         Key: { tenant_id: order.tenant_id }
      }));

      const tenant = tenantResult.Item;
      if (!tenant || !tenant.razorpay_merchant_key_id || !tenant.razorpay_merchant_key_secret) {
         return response(400, { error: 'Merchant payments not configured' });
      }

      // ⭐ MODEL A: Direct Merchant Settlement
      // We instantiate Razorpay with the MERCHANT'S keys.
      // WebDPro is not involved in the money flow.
      const merchantRazorpay = new Razorpay({
         key_id: tenant.razorpay_merchant_key_id,
         key_secret: tenant.razorpay_merchant_key_secret
      });

      // 3. Create Razorpay Order (Direct)
      const amountInPaise = Math.round(order.total_amount * 100);

      const orderOptions = {
         amount: amountInPaise,
         currency: 'INR',
         receipt: order_id,
         notes: {
            store_id: order.store_id,
            tenant_id: order.tenant_id
         }
         // ❌ NO transfers array needed - money goes to the owner of the Key ID (The Merchant)
      };

      const razorpayOrder = await merchantRazorpay.orders.create(orderOptions);

      // 4. Update Order Record
      await docClient.send(new UpdateCommand({
         TableName: ORDERS_TABLE,
         Key: { order_id },
         UpdateExpression: 'SET razorpay_order_id = :roid, payment_status = :pstatus, updated_at = :now',
         ExpressionAttributeValues: {
            ':roid': razorpayOrder.id,
            ':pstatus': 'AWAITING_PAYMENT',
            ':now': new Date().toISOString()
         }
      }));

      return response(200, {
         success: true,
         order_id: order_id,
         razorpay_order_id: razorpayOrder.id,
         amount: razorpayOrder.amount,
         currency: razorpayOrder.currency
      });

   } catch (error: any) {
      console.error('Checkout Error:', error);
      return response(500, {
         error: 'Failed to create payment order',
         details: error.message
      });
   }
};
