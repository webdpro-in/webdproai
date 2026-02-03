import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX || 'webdpro'}-orders`;
const PRODUCTS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX || 'webdpro'}-products`;

const response = (statusCode: number, body: any) => ({
   statusCode,
   headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
   },
   body: JSON.stringify(body),
});

export const createOrder = async (event: any) => {
   try {
      const body = JSON.parse(event.body || '{}');
      const { store_id, tenant_id, items, customer, delivery_fee = 0 } = body;

      if (!store_id || !items || !items.length) {
         return response(400, { error: 'Missing required fields' });
      }

      // 1. Validate Stock & Calculate Prices
      // Note: In a large scale system, we'd use the Inventory Service API.
      // For MVP/Speed, we read the products table directly (granted via IAM).
      const productKeys = items.map((item: any) => ({
         store_id,
         product_id: item.product_id
      }));

      const productsResult = await docClient.send(new BatchGetCommand({
         RequestItems: {
            [PRODUCTS_TABLE]: {
               Keys: productKeys
            }
         }
      }));

      const productsMap = new Map();
      (productsResult.Responses?.[PRODUCTS_TABLE] || []).forEach((p: any) => {
         productsMap.set(p.product_id, p);
      });

      let subtotal = 0;
      const validatedItems = [];

      for (const item of items) {
         const product = productsMap.get(item.product_id);
         if (!product) {
            return response(400, { error: `Product ${item.product_id} not found` });
         }
         if (product.stock_quantity < item.quantity) {
            return response(400, { error: `Insufficient stock for ${product.name}` });
         }

         const itemTotal = product.price * item.quantity;
         subtotal += itemTotal;
         validatedItems.push({
            ...item,
            name: product.name,
            price: product.price,
            total: itemTotal
         });
      }

      // 2. Create Order
      const orderId = uuidv4();
      const totalAmount = subtotal + delivery_fee;
      const now = new Date().toISOString();

      const order = {
         order_id: orderId,
         store_id,
         tenant_id,
         status: 'PENDING_PAYMENT',
         items: validatedItems,
         subtotal,
         delivery_fee,
         total_amount: totalAmount,
         customer_email: customer?.email,
         customer_name: customer?.name,
         customer_phone: customer?.phone,
         delivery_address: customer?.address,
         created_at: now,
         updated_at: now
      };

      await docClient.send(new PutCommand({
         TableName: ORDERS_TABLE,
         Item: order
      }));

      return response(201, {
         success: true,
         order_id: orderId,
         total_amount: totalAmount,
         currency: 'INR', // Default for now
         message: 'Order created, proceed to payment'
      });

   } catch (error) {
      console.error('Create Order Error:', error);
      return response(500, { error: 'Failed to create order' });
   }
};

export const getOrder = async (event: any) => {
   try {
      const orderId = event.pathParameters?.orderId;
      if (!orderId) return response(400, { error: 'Order ID required' });

      const result = await docClient.send(new GetCommand({
         TableName: ORDERS_TABLE,
         Key: { order_id: orderId }
      }));

      if (!result.Item) return response(404, { error: 'Order not found' });

      return response(200, result.Item);
   } catch (error) {
      console.error('Get Order Error:', error);
      return response(500, { error: 'Failed to retrieve order' });
   }
};

export const listOrders = async (event: any) => {
   // Basic implementation for merchant dashboard
   try {
      const storeId = event.queryStringParameters?.storeId;
      if (!storeId) return response(400, { error: 'Store ID required' });

      // This requires GSI: store-index
      const result = await docClient.send(new QueryCommand({
         TableName: ORDERS_TABLE,
         IndexName: 'store-index',
         KeyConditionExpression: 'store_id = :storeId',
         ExpressionAttributeValues: {
            ':storeId': storeId
         }
      }));

      return response(200, { orders: result.Items || [] });
   } catch (error) {
      console.error('List Orders Error:', error);
      return response(500, { error: 'Failed to list orders' });
   }
}


export const ping = async () => response(200, { status: 'ok', service: 'orders', timestamp: new Date().toISOString() });
