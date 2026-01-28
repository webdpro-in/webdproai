/**
 * WebDPro Backend - Store Handlers
 * Generate, manage, and deploy AI-generated websites
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { v4 as uuidv4 } from 'uuid';
import { aiClient } from '../lib/ai-client';
import { logger } from '../lib/logger';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-north-1' });
const cfClient = new CloudFrontClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'eu-north-1' });

const STORES_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-stores`;
const S3_BUCKET = process.env.S3_BUCKET || 'webdpro-ai';
const CLOUDFRONT_DIST_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const EVENTS_TOPIC_ARN = process.env.EVENTS_TOPIC_ARN;

interface APIGatewayEvent {
   pathParameters?: { storeId?: string };
   body: string | null;
   headers?: { Authorization?: string; authorization?: string; [key: string]: string | undefined };
   requestContext?: { authorizer?: { claims?: { sub: string; 'custom:tenant_id'?: string } } };
}

// Helper: Create response
const response = (statusCode: number, body: any) => ({
   statusCode,
   headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Credentials': true,
   },
   body: JSON.stringify(body),
});

// Helper: Get tenant ID from token
const getTenantId = (event: APIGatewayEvent): string | null => {
   // Try to get from authorizer first (if configured)
   const authorizerTenantId = event.requestContext?.authorizer?.claims?.['custom:tenant_id'];
   if (authorizerTenantId) {
      return authorizerTenantId;
   }

   // Fallback: decode JWT from Authorization header
   try {
      const authHeader = event.headers?.Authorization || event.headers?.authorization;
      if (!authHeader) return null;

      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      return payload['custom:tenant_id'] || payload.sub || null;
   } catch (error) {
      console.error('Error decoding token:', error);
      return null;
   }
};

/**
 * POST /stores/generate
 * Generate a new AI-powered website
 */
export const generateStore = async (event: APIGatewayEvent) => {
   let tenantId: string | null = null;
   let storeId: string | null = null;

   try {
      tenantId = getTenantId(event);
      if (!tenantId) {
         logger.warn('generateStore', 'Unauthorized access attempt - tenant not found');
         return response(401, { error: 'Unauthorized - tenant not found' });
      }

      const body = JSON.parse(event.body || '{}');
      const { prompt, storeType, language = 'en', currency = 'INR' } = body;

      if (!prompt) {
         logger.warn('generateStore', 'Missing prompt in request', { tenantId });
         return response(400, { error: 'Prompt is required' });
      }

      storeId = uuidv4();
      const createdAt = new Date().toISOString();

      logger.info('generateStore', 'Starting store generation', {
         tenantId,
         storeId,
         storeType: storeType || 'general',
      });

      // Create store record (DRAFT status)
      const store = {
         tenant_id: tenantId,
         store_id: storeId,
         status: 'GENERATING',
         prompt,
         store_type: storeType || 'general',
         language,
         currency,
         domain: null,
         custom_domain: null,
         live_url: null,
         created_at: createdAt,
         updated_at: createdAt,
      };

      try {
         await docClient.send(new PutCommand({
            TableName: STORES_TABLE,
            Item: store,
         }));
         logger.info('generateStore', 'Store record created in DynamoDB', { storeId, tenantId });
      } catch (dbError: any) {
         logger.error('generateStore', 'Failed to create store record in DynamoDB', dbError, {
            tableName: STORES_TABLE,
            storeId,
            tenantId,
         });
         return response(500, { error: 'Failed to create store record' });
      }

      // Generate website using AI
      logger.info('generateStore', 'Calling AI service for website generation', { storeId });

      let aiResponse;
      try {
         aiResponse = await aiClient.generateWebsite({
            input: {
               businessName: extractBusinessName(prompt),
               businessType: storeType || 'general',
               location: 'India',
               description: prompt,
               language,
            },
            tenantId,
            storeId
         });
      } catch (aiError: any) {
         logger.error('generateStore', 'AI service call failed', aiError, { storeId, tenantId });
         throw new Error(aiError.message || 'AI generation failed');
      }

      if (!aiResponse.success || !aiResponse.data) {
         logger.error('generateStore', 'AI generation returned unsuccessful response', undefined, {
            storeId,
            tenantId,
            error: aiResponse.error,
         });
         throw new Error(aiResponse.error || 'AI generation failed');
      }

      const website = aiResponse.data;
      logger.info('generateStore', 'AI generation complete', { storeId });

      // Upload to S3 (draft folder)
      const draftPath = `drafts/${tenantId}/${storeId}`;

      try {
         await Promise.all([
            s3Client.send(new PutObjectCommand({
               Bucket: S3_BUCKET,
               Key: `${draftPath}/index.html`,
               Body: website.html,
               ContentType: 'text/html',
            })),
            s3Client.send(new PutObjectCommand({
               Bucket: S3_BUCKET,
               Key: `${draftPath}/styles.css`,
               Body: website.css,
               ContentType: 'text/css',
            })),
            s3Client.send(new PutObjectCommand({
               Bucket: S3_BUCKET,
               Key: `${draftPath}/config.json`,
               Body: JSON.stringify(website.config, null, 2),
               ContentType: 'application/json',
            })),
         ]);
         logger.info('generateStore', 'Files uploaded to S3', { storeId, bucket: S3_BUCKET, path: draftPath });
      } catch (s3Error: any) {
         logger.error('generateStore', 'S3 upload failed', s3Error, {
            storeId,
            tenantId,
            bucket: S3_BUCKET,
            path: draftPath,
         });
         return response(500, { error: 'Failed to upload website files' });
      }

      // Update store status
      try {
         await docClient.send(new UpdateCommand({
            TableName: STORES_TABLE,
            Key: { tenant_id: tenantId, store_id: storeId },
            UpdateExpression: 'SET #status = :status, config = :config, preview_url = :preview, updated_at = :time',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
               ':status': 'DRAFT',
               ':config': website.config,
               ':preview': `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${draftPath}/index.html`,
               ':time': new Date().toISOString(),
            },
         }));
         logger.info('generateStore', 'Store status updated to DRAFT', { storeId });
      } catch (updateError: any) {
         logger.error('generateStore', 'Failed to update store status', updateError, {
            storeId,
            tenantId,
            tableName: STORES_TABLE,
         });
      }

      // Publish STORE_CREATED event
      await publishEvent('STORE_CREATED', {
         tenantId,
         storeId,
         storeType: storeType || 'general',
         status: 'DRAFT',
         createdAt: new Date().toISOString()
      });

      // Populate Inventory from AI Results
      const productsTable = `${process.env.DYNAMODB_TABLE_PREFIX}-products`;
      try {
         const productSection = website.config.sections.find((s: any) => s.type === 'products');
         if (productSection && productSection.content && Array.isArray(productSection.content.products)) {
            logger.info('generateStore', `Auto-populating ${productSection.content.products.length} products`, { storeId });

            const productPromises = productSection.content.products.map((p: any) => {
               const productId = uuidv4();
               const now = new Date().toISOString();
               return docClient.send(new PutCommand({
                  TableName: productsTable,
                  Item: {
                     tenant_id: tenantId,
                     product_id: productId,
                     business_id: storeId,
                     store_id: storeId,
                     name: p.name,
                     description: p.description,
                     price: parseFloat(p.price) || 0,
                     category: p.category || 'General',
                     sku: `AI_${productId.slice(0, 8)}`,
                     stock_quantity: 50, // Default stock
                     min_stock_level: 5,
                     images: [], // Images will be generated later or placeholders
                     variants: [],
                     status: 'active',
                     is_active: true,
                     created_at: now,
                     updated_at: now,
                     search_keywords: [p.name.toLowerCase(), p.category?.toLowerCase() || ''],
                     views_count: 0,
                     orders_count: 0,
                     revenue_total: 0
                  }
               }));
            });

            await Promise.all(productPromises);
            logger.info('generateStore', 'Products populated successfully', { storeId });
         }
      } catch (inventoryError: any) {
         logger.error('generateStore', 'Failed to populate inventory', inventoryError, { storeId });
         // Do not fail the store generation, just log error
      }

      return response(201, {
         success: true,
         message: 'Store generated successfully',
         store: {
            store_id: storeId,
            status: 'DRAFT',
            config: website.config,
            preview_url: `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${draftPath}/index.html`,
         },
      });
   } catch (error: any) {
      logger.error('generateStore', 'Store generation failed', error, { storeId, tenantId });

      // Update store status to ERROR
      if (tenantId && storeId) {
         try {
            await docClient.send(new UpdateCommand({
               TableName: STORES_TABLE,
               Key: { tenant_id: tenantId, store_id: storeId },
               UpdateExpression: 'SET #status = :status, updated_at = :time',
               ExpressionAttributeNames: { '#status': 'status' },
               ExpressionAttributeValues: {
                  ':status': 'ERROR',
                  ':time': new Date().toISOString(),
               },
            }));
         } catch (updateError: any) {
            logger.error('generateStore', 'Failed to update store status to ERROR', updateError);
         }
      }

      return response(500, { error: error.message || 'Failed to generate store' });
   }
};

/**
 * GET /stores
 * Get all stores for tenant
 */
export const getStores = async (event: APIGatewayEvent) => {
   try {
      const tenantId = getTenantId(event);
      if (!tenantId) {
         logger.warn('getStores', 'Unauthorized access attempt');
         return response(401, { error: 'Unauthorized' });
      }

      logger.info('getStores', 'Fetching stores for tenant', { tenantId });

      const result = await docClient.send(new QueryCommand({
         TableName: STORES_TABLE,
         KeyConditionExpression: 'tenant_id = :tenantId',
         ExpressionAttributeValues: {
            ':tenantId': tenantId,
         },
      }));

      logger.info('getStores', 'Stores fetched successfully', {
         tenantId,
         count: result.Count || 0,
      });

      return response(200, {
         success: true,
         stores: result.Items || [],
         count: result.Count || 0,
      });
   } catch (error: any) {
      logger.error('getStores', 'Failed to fetch stores', error);
      return response(500, { error: 'Failed to fetch stores' });
   }
};

/**
 * GET /stores/{storeId}
 * Get single store details
 */
export const getStore = async (event: APIGatewayEvent) => {
   try {
      const tenantId = getTenantId(event);
      const storeId = event.pathParameters?.storeId;

      if (!tenantId || !storeId) {
         logger.warn('getStore', 'Missing tenant ID or store ID', { tenantId, storeId });
         return response(400, { error: 'Store ID required' });
      }

      logger.info('getStore', 'Fetching store details', { tenantId, storeId });

      const result = await docClient.send(new GetCommand({
         TableName: STORES_TABLE,
         Key: { tenant_id: tenantId, store_id: storeId },
      }));

      if (!result.Item) {
         logger.warn('getStore', 'Store not found', { tenantId, storeId });
         return response(404, { error: 'Store not found' });
      }

      logger.info('getStore', 'Store fetched successfully', { tenantId, storeId });

      return response(200, {
         success: true,
         store: result.Item,
      });
   } catch (error: any) {
      logger.error('getStore', 'Failed to fetch store', error);
      return response(500, { error: 'Failed to fetch store' });
   }
};

/**
 * POST /stores/{storeId}/publish
 * Publish store to production
 */
export const publishStore = async (event: APIGatewayEvent) => {
   try {
      const tenantId = getTenantId(event);
      const storeId = event.pathParameters?.storeId;
      const body = JSON.parse(event.body || '{}');

      if (!tenantId || !storeId) {
         logger.warn('publishStore', 'Missing tenant ID or store ID', { tenantId, storeId });
         return response(400, { error: 'Store ID required' });
      }

      logger.info('publishStore', 'Publishing store', { tenantId, storeId });

      // Get store
      const storeResult = await docClient.send(new GetCommand({
         TableName: STORES_TABLE,
         Key: { tenant_id: tenantId, store_id: storeId },
      }));

      const store = storeResult.Item;
      if (!store) {
         logger.warn('publishStore', 'Store not found', { tenantId, storeId });
         return response(404, { error: 'Store not found' });
      }

      // Check Merchant Subscription
      const merchantResult = await docClient.send(new GetCommand({
         TableName: 'webdpro-merchants',
         Key: { merchant_id: tenantId }
      }));

      const merchant = merchantResult.Item;
      const isSubscribed = merchant &&
         merchant.subscription_status === 'active' &&
         new Date(merchant.subscription_expires_at) > new Date();

      if (!isSubscribed) {
         // Allow if store was previously paid for (legacy) or if doing one-time payment flow
         if (store.status !== 'PAID') {
            logger.warn('publishStore', 'Subscription required', { tenantId, storeId });
            return response(402, {
               error: 'Active subscription required to publish',
               requires_payment: true,
               pricing_url: '/pricing'
            });
         }
      }

      // If valid, proceed (even if DRAFT)


      // Copy from drafts to production
      const draftPath = `drafts/${tenantId}/${storeId}`;
      const prodPath = `stores/${storeId}`;
      const files = ['index.html', 'styles.css', 'config.json'];

      try {
         await Promise.all(files.map(file =>
            s3Client.send(new CopyObjectCommand({
               Bucket: S3_BUCKET,
               CopySource: `${S3_BUCKET}/${draftPath}/${file}`,
               Key: `${prodPath}/${file}`,
            }))
         ));
         logger.info('publishStore', 'Files copied to production', {
            storeId,
            bucket: S3_BUCKET,
            from: draftPath,
            to: prodPath,
         });
      } catch (s3Error: any) {
         logger.error('publishStore', 'S3 copy failed', s3Error, {
            storeId,
            tenantId,
            bucket: S3_BUCKET,
         });
         return response(500, { error: 'Failed to publish store files' });
      }

      // Generate subdomain
      const subdomain = body.subdomain || `store-${storeId.substring(0, 8)}`;
      const liveUrl = `https://${subdomain}.webdpro.in`;

      // Update store status
      await docClient.send(new UpdateCommand({
         TableName: STORES_TABLE,
         Key: { tenant_id: tenantId, store_id: storeId },
         UpdateExpression: 'SET #status = :status, live_url = :url, domain = :domain, published_at = :time, updated_at = :time',
         ExpressionAttributeNames: { '#status': 'status' },
         ExpressionAttributeValues: {
            ':status': 'PUBLISHED',
            ':url': liveUrl,
            ':domain': `${subdomain}.webdpro.in`,
            ':time': new Date().toISOString(),
         },
      }));

      logger.info('publishStore', 'Store published successfully', {
         storeId,
         tenantId,
         liveUrl,
      });

      // Invalidate CloudFront cache
      if (CLOUDFRONT_DIST_ID) {
         try {
            await cfClient.send(new CreateInvalidationCommand({
               DistributionId: CLOUDFRONT_DIST_ID,
               InvalidationBatch: {
                  Paths: {
                     Quantity: 1,
                     Items: [`/${prodPath}/*`],
                  },
                  CallerReference: `publish-${storeId}-${Date.now()}`,
               },
            }));
            logger.info('publishStore', 'CloudFront cache invalidated', { storeId });
         } catch (cfError: any) {
            logger.warn('publishStore', 'CloudFront invalidation failed', { error: cfError.message });
         }
      }

      return response(200, {
         success: true,
         message: 'Store published successfully',
         store: {
            store_id: storeId,
            status: 'PUBLISHED',
            live_url: liveUrl,
            domain: `${subdomain}.webdpro.in`,
         },
      });
   } catch (error: any) {
      logger.error('publishStore', 'Failed to publish store', error);
      return response(500, { error: error.message || 'Failed to publish store' });
   }
};

/**
 * PUT /stores/{storeId}
 * Update store configuration
 */
export const updateStore = async (event: APIGatewayEvent) => {
   try {
      const tenantId = getTenantId(event);
      const storeId = event.pathParameters?.storeId;
      const body = JSON.parse(event.body || '{}');

      if (!tenantId || !storeId) {
         logger.warn('updateStore', 'Missing tenant ID or store ID', { tenantId, storeId });
         return response(400, { error: 'Store ID required' });
      }

      logger.info('updateStore', 'Updating store', { tenantId, storeId });

      // Get current store
      const storeResult = await docClient.send(new GetCommand({
         TableName: STORES_TABLE,
         Key: { tenant_id: tenantId, store_id: storeId },
      }));

      const store = storeResult.Item;
      if (!store) {
         logger.warn('updateStore', 'Store not found', { tenantId, storeId });
         return response(404, { error: 'Store not found' });
      }

      // If published, require republish payment
      if (store.status === 'PUBLISHED') {
         logger.warn('updateStore', 'Cannot update published store', { tenantId, storeId });
         return response(400, {
            error: 'Published stores require republish. This will create a new version.',
            requires_payment: true,
         });
      }

      // Update allowed fields
      const allowedFields = ['config', 'custom_domain', 'language', 'currency'];
      const updateExpressions: string[] = [];
      const expressionValues: Record<string, any> = {};
      const expressionNames: Record<string, string> = {};

      for (const field of allowedFields) {
         if (body[field] !== undefined) {
            updateExpressions.push(`#${field} = :${field}`);
            expressionValues[`:${field}`] = body[field];
            expressionNames[`#${field}`] = field;
         }
      }

      updateExpressions.push('updated_at = :time');
      expressionValues[':time'] = new Date().toISOString();

      await docClient.send(new UpdateCommand({
         TableName: STORES_TABLE,
         Key: { tenant_id: tenantId, store_id: storeId },
         UpdateExpression: `SET ${updateExpressions.join(', ')}`,
         ExpressionAttributeValues: expressionValues,
         ExpressionAttributeNames: expressionNames,
      }));

      logger.info('updateStore', 'Store updated successfully', { tenantId, storeId });

      return response(200, {
         success: true,
         message: 'Store updated successfully',
      });
   } catch (error: any) {
      logger.error('updateStore', 'Failed to update store', error);
      return response(500, { error: 'Failed to update store' });
   }
};

// Helper: Extract business name from prompt
function extractBusinessName(prompt: string): string {
   const match = prompt.match(/for ([\w\s]+)/i) || prompt.match(/([\w\s]+) -/) || prompt.match(/^([\w\s]+)/);
   return match ? match[1].trim() : "My Business";
}

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
