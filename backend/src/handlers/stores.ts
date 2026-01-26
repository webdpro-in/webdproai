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
   requestContext?: { authorizer?: { claims?: { sub: string; 'custom:tenant_id'?: string } } };
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

// Helper: Get tenant ID from token
const getTenantId = (event: APIGatewayEvent): string | null => {
   return event.requestContext?.authorizer?.claims?.['custom:tenant_id'] || null;
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
         return response(401, { error: 'Unauthorized - tenant not found' });
      }

      const body = JSON.parse(event.body || '{}');
      const { prompt, storeType, language = 'en', currency = 'INR' } = body;

      if (!prompt) {
         return response(400, { error: 'Prompt is required' });
      }

      storeId = uuidv4();
      const createdAt = new Date().toISOString();

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

      await docClient.send(new PutCommand({
         TableName: STORES_TABLE,
         Item: store,
      }));

      // Generate website using AI
      console.log(`[Store ${storeId}] Starting AI generation...`);

      const aiResponse = await aiClient.generateWebsite({
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

      if (!aiResponse.success || !aiResponse.data) {
         throw new Error(aiResponse.error || 'AI generation failed');
      }

      const website = aiResponse.data;
      console.log(`[Store ${storeId}] AI generation complete`);

      // Upload to S3 (draft folder)
      const draftPath = `drafts/${tenantId}/${storeId}`;

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

      // Update store status
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

      // Publish STORE_CREATED event
      await publishEvent('STORE_CREATED', {
         tenantId,
         storeId,
         storeType: storeType || 'general',
         status: 'DRAFT',
         createdAt: new Date().toISOString()
      });

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
      console.error('Error generating store:', error);

      // Update store status to ERROR
      try {
         await docClient.send(new UpdateCommand({
            TableName: STORES_TABLE,
            Key: { tenant_id: tenantId || 'unknown', store_id: storeId || 'unknown' },
            UpdateExpression: 'SET #status = :status, updated_at = :time',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
               ':status': 'ERROR',
               ':time': new Date().toISOString(),
            },
         }));
      } catch (updateError) {
         console.error('Failed to update store status to ERROR:', updateError);
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
         return response(401, { error: 'Unauthorized' });
      }

      const result = await docClient.send(new QueryCommand({
         TableName: STORES_TABLE,
         KeyConditionExpression: 'tenant_id = :tenantId',
         ExpressionAttributeValues: {
            ':tenantId': tenantId,
         },
      }));

      return response(200, {
         success: true,
         stores: result.Items || [],
         count: result.Count || 0,
      });
   } catch (error) {
      console.error('Error fetching stores:', error);
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
         return response(400, { error: 'Store ID required' });
      }

      const result = await docClient.send(new GetCommand({
         TableName: STORES_TABLE,
         Key: { tenant_id: tenantId, store_id: storeId },
      }));

      if (!result.Item) {
         return response(404, { error: 'Store not found' });
      }

      return response(200, {
         success: true,
         store: result.Item,
      });
   } catch (error) {
      console.error('Error fetching store:', error);
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
         return response(400, { error: 'Store ID required' });
      }

      // Get store
      const storeResult = await docClient.send(new GetCommand({
         TableName: STORES_TABLE,
         Key: { tenant_id: tenantId, store_id: storeId },
      }));

      const store = storeResult.Item;
      if (!store) {
         return response(404, { error: 'Store not found' });
      }

      if (store.status !== 'DRAFT' && store.status !== 'PAID') {
         return response(400, { error: 'Store must be in DRAFT or PAID status to publish' });
      }

      // Copy from drafts to production
      const draftPath = `drafts/${tenantId}/${storeId}`;
      const prodPath = `stores/${storeId}`;
      const files = ['index.html', 'styles.css', 'config.json'];

      await Promise.all(files.map(file =>
         s3Client.send(new CopyObjectCommand({
            Bucket: S3_BUCKET,
            CopySource: `${S3_BUCKET}/${draftPath}/${file}`,
            Key: `${prodPath}/${file}`,
         }))
      ));

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
         } catch (cfError) {
            console.warn('CloudFront invalidation failed:', cfError);
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
      console.error('Error publishing store:', error);
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
         return response(400, { error: 'Store ID required' });
      }

      // Get current store
      const storeResult = await docClient.send(new GetCommand({
         TableName: STORES_TABLE,
         Key: { tenant_id: tenantId, store_id: storeId },
      }));

      const store = storeResult.Item;
      if (!store) {
         return response(404, { error: 'Store not found' });
      }

      // If published, require republish payment
      if (store.status === 'PUBLISHED') {
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

      return response(200, {
         success: true,
         message: 'Store updated successfully',
      });
   } catch (error) {
      console.error('Error updating store:', error);
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
