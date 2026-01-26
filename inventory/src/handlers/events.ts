/**
 * WebDPro Inventory - Event Handlers
 * Handles SNS events from other services
 */

import { SNSEvent, SNSEventRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'eu-north-1' });

const PRODUCTS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-products`;
const EVENTS_TOPIC_ARN = process.env.EVENTS_TOPIC_ARN;

interface OrderItem {
   product_id: string;
   quantity: number;
}

interface OrderPlacedEvent {
   eventType: 'ORDER_PLACED';
   data: {
      tenantId: string;
      storeId: string;
      orderId: string;
      items: OrderItem[];
   };
}

/**
 * SNS Event Handler
 * Processes events from other services
 */
export const handleEvents = async (event: SNSEvent) => {
   console.log('Processing inventory events:', JSON.stringify(event, null, 2));

   for (const record of event.Records) {
      try {
         await processEventRecord(record);
      } catch (error) {
         console.error('Error processing event record:', error);
         // Continue processing other records
      }
   }
};

async function processEventRecord(record: SNSEventRecord) {
   const message = JSON.parse(record.Sns.Message);
   const { eventType, data } = message;

   console.log(`Processing event: ${eventType}`);

   switch (eventType) {
      case 'ORDER_PLACED':
         await handleOrderPlaced(data);
         break;
      
      case 'ORDER_CANCELLED':
         await handleOrderCancelled(data);
         break;
      
      default:
         console.log(`Unhandled event type: ${eventType}`);
   }
}

/**
 * Handle ORDER_PLACED event
 * Deduct stock quantities for ordered items
 */
async function handleOrderPlaced(data: OrderPlacedEvent['data']) {
   console.log(`Deducting stock for order ${data.orderId}`);

   const lowStockProducts: string[] = [];

   for (const item of data.items) {
      try {
         // Update stock quantity
         const result = await docClient.send(new UpdateCommand({
            TableName: PRODUCTS_TABLE,
            Key: { tenant_id: data.tenantId, product_id: item.product_id },
            UpdateExpression: 'SET stock_quantity = stock_quantity - :quantity, updated_at = :updated_at',
            ConditionExpression: 'stock_quantity >= :quantity AND store_id = :storeId',
            ExpressionAttributeValues: {
               ':quantity': item.quantity,
               ':storeId': data.storeId,
               ':updated_at': new Date().toISOString(),
            },
            ReturnValues: 'ALL_NEW',
         }));

         // Check if stock is now low
         const updatedProduct = result.Attributes;
         if (updatedProduct && updatedProduct.stock_quantity <= updatedProduct.low_stock_threshold) {
            lowStockProducts.push(item.product_id);
         }

      } catch (error) {
         console.error(`Failed to deduct stock for product ${item.product_id}:`, error);
         
         // Publish stock deduction failed event
         await publishEvent('STOCK_DEDUCTION_FAILED', {
            tenantId: data.tenantId,
            storeId: data.storeId,
            orderId: data.orderId,
            productId: item.product_id,
            requestedQuantity: item.quantity,
            error: error instanceof Error ? error.message : 'Unknown error'
         });
      }
   }

   // Publish low stock alerts
   if (lowStockProducts.length > 0) {
      await publishEvent('LOW_STOCK_ALERT', {
         tenantId: data.tenantId,
         storeId: data.storeId,
         productIds: lowStockProducts,
         timestamp: new Date().toISOString()
      });
   }

   console.log(`Stock deduction completed for order ${data.orderId}`);
}

/**
 * Handle ORDER_CANCELLED event
 * Restore stock quantities for cancelled items
 */
async function handleOrderCancelled(data: OrderPlacedEvent['data']) {
   console.log(`Restoring stock for cancelled order ${data.orderId}`);

   for (const item of data.items) {
      try {
         await docClient.send(new UpdateCommand({
            TableName: PRODUCTS_TABLE,
            Key: { tenant_id: data.tenantId, product_id: item.product_id },
            UpdateExpression: 'SET stock_quantity = stock_quantity + :quantity, updated_at = :updated_at',
            ConditionExpression: 'store_id = :storeId',
            ExpressionAttributeValues: {
               ':quantity': item.quantity,
               ':storeId': data.storeId,
               ':updated_at': new Date().toISOString(),
            },
         }));

      } catch (error) {
         console.error(`Failed to restore stock for product ${item.product_id}:`, error);
      }
   }

   console.log(`Stock restoration completed for order ${data.orderId}`);
}

/**
 * Publish event to SNS
 */
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