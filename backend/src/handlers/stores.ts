/**
 * WebDPro Backend - Store Handlers
 * Generate, manage, and deploy AI-generated websites
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, CopyObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand, GetDistributionConfigCommand } from '@aws-sdk/client-cloudfront';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { v4 as uuidv4 } from 'uuid';
import { aiClient } from '../lib/ai-client';
import { logger } from '../lib/logger';
import { getTenantId, response, APIGatewayEvent } from '../lib/utils';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-north-1' });
const cfClient = new CloudFrontClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'eu-north-1' });

const STORES_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-stores`;
const S3_BUCKET = process.env.S3_BUCKET || 'webdpro-ai';
const CLOUDFRONT_DIST_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const EVENTS_TOPIC_ARN = process.env.EVENTS_TOPIC_ARN;


/**
 * Verify all system prerequisites before generating a store
 * Fails gracefully if any critical service is unreachable
 */
const verifyPrerequisites = async (tenantId: string) => {
   const checks: Promise<any>[] = [];

   // 1. Verify S3 Write Access
   checks.push(
      s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }))
         .then(() => logger.info('verifyPrerequisites', '✅ S3 Bucket Access Verified'))
         .catch(err => { throw new Error(`S3 Bucket Access Failed: ${err.message}`) })
   );

   // 2. Verify CloudFront Access (if configured)
   if (CLOUDFRONT_DIST_ID) {
      checks.push(
         cfClient.send(new GetDistributionConfigCommand({ Id: CLOUDFRONT_DIST_ID }))
            .then(() => logger.info('verifyPrerequisites', '✅ CloudFront Access Verified'))
            .catch(err => { throw new Error(`CloudFront Access Failed: ${err.message}`) })
      );
   } else {
      logger.warn('verifyPrerequisites', '⚠️ CloudFront ID not configured - verification skipped');
   }

   // 3. Verify AI Service Configuration
   if (!process.env.AI_USE_BEDROCK && !process.env.AI_SERVICE_URL) {
      throw new Error('AI Service Configuration Missing (bedrock or external URL required)');
   }

   // 4. Verify Store Record Table
   checks.push(
      docClient.send(new GetCommand({ TableName: STORES_TABLE, Key: { tenant_id: 'check', store_id: 'check' } }))
         .then(() => logger.info('verifyPrerequisites', '✅ DynamoDB Stores Table Verified'))
         .catch(err => { throw new Error(`DynamoDB Access Failed: ${err.message}`) })
   );

   // Execute all checks
   await Promise.all(checks);
   logger.info('verifyPrerequisites', 'All system checks passed');
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

      // STRICT VERIFICATION: Verify all connections before proceeding
      try {
         await verifyPrerequisites(tenantId);
      } catch (verifyError: any) {
         logger.error('generateStore', 'Prerequisite check failed', verifyError, { tenantId });
         return response(503, {
            error: 'System prerequisite check failed. Please contact support.',
            details: verifyError.message
         });
      }


      let body: Record<string, unknown> = {};
      try {
         body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : {};
      } catch {
         logger.warn('generateStore', 'Invalid JSON body');
         return response(400, { error: 'Invalid JSON in request body' });
      }
      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
      const storeType = typeof body.storeType === 'string' ? body.storeType : 'general';
      const language = typeof body.language === 'string' ? body.language : 'en';
      const currency = typeof body.currency === 'string' ? body.currency : 'INR';

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

      // STRICT VERIFICATION: Verify all connections before proceeding
      try {
         await verifyPrerequisites(tenantId);
      } catch (verifyError: any) {
         logger.error('generateStore', 'Prerequisite check failed', verifyError, { tenantId });
         return response(503, {
            error: 'System prerequisite check failed. Please contact support.',
            details: verifyError.message
         });
      }

      // Create store record (DRAFT status)
      const isDemo = body.demoMode === true;
      const demoConfig = {
         sections: [
            {
               id: "navbar",
               type: "navbar",
               content: { title: "Lumina" }
            },
            {
               id: "hero",
               type: "hero",
               content: {
                  headline: "Redefine Your Digital Style",
                  description: "Experience the future of fashion.",
                  buttonText: "Explore Collection"
               }
            },
            {
               id: "products",
               type: "products",
               content: {
                  title: "Trending This Week",
                  products: [
                     { name: "Minimalist Cotton Tee", price: "1299" },
                     { name: "Urban Denim Jacket", price: "3499" },
                     { name: "Classic Sneakers", price: "4999" }
                  ]
               }
            },
            {
               id: "features",
               type: "features",
               content: { title: "Crafted for Excellence" }
            },
            {
               id: "footer",
               type: "footer",
               content: { copyright: "2026 WebDPro AI" }
            }
         ]
      };

      const store = {
         tenant_id: tenantId,
         store_id: storeId,
         status: isDemo ? 'PUBLISHED' : 'GENERATING',
         prompt,
         store_type: storeType || 'general',
         language,
         currency,
         is_demo: isDemo,
         config: isDemo ? demoConfig : null,
         domain: isDemo ? `store-${storeId.substring(0, 8)}.webdpro.in` : null,
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
         logger.info('generateStore', 'Store record created in DynamoDB', { storeId, tenantId, isDemo });
      } catch (dbError: any) {
         logger.error('generateStore', 'Failed to create store record in DynamoDB', dbError, {
            tableName: STORES_TABLE,
            storeId,
            tenantId,
         });
         return response(500, { error: 'Failed to create store record' });
      }

      if (isDemo) {
         logger.info('generateStore', 'Demo mode enabled. Copying template and skipping AI.', { storeId });

         const demoSource = 'demo-sites/default-store'; // Path in S3
         const targetPath = `stores/${storeId}`; // Production path

         try {
            // Copy index.html
            await s3Client.send(new CopyObjectCommand({
               Bucket: S3_BUCKET,
               CopySource: `${S3_BUCKET}/${demoSource}/index.html`,
               Key: `${targetPath}/index.html`
            }));

            // Copy styles.css (optional if exists, index.html might use CDN)
            // We just copy index.html as per demo template

            // Populate Demo Inventory
            const pTable = `${process.env.DYNAMODB_TABLE_PREFIX}-products`;
            const demoProducts = [
               { name: "Minimalist Cotton Tee", price: 1299, category: "Apparel" },
               { name: "Urban Denim Jacket", price: 3499, category: "Apparel" },
               { name: "Classic Sneakers", price: 4999, category: "Footwear" }
            ];

            await Promise.all(demoProducts.map(p => {
               const pId = uuidv4();
               return docClient.send(new PutCommand({
                  TableName: pTable,
                  Item: {
                     tenant_id: tenantId,
                     product_id: pId,
                     store_id: storeId,
                     name: p.name,
                     price: p.price,
                     category: p.category,
                     stock_quantity: 50,
                     status: 'active',
                     created_at: new Date().toISOString()
                  }
               }));
            }));

            // Update Store with Live URL
            const liveUrl = `${process.env.FRONTEND_URL || 'https://d3qhkomcxcxmtl.cloudfront.net'}/${targetPath}/index.html`;
            // Note: In real prod, CloudFront routes /stores/{id} -> bucket/stores/{id}

            await docClient.send(new UpdateCommand({
               TableName: STORES_TABLE,
               Key: { tenant_id: tenantId, store_id: storeId },
               UpdateExpression: 'SET live_url = :url, preview_url = :url',
               ExpressionAttributeValues: { ':url': liveUrl }
            }));

            return response(201, {
               success: true,
               message: 'Demo store created',
               store: { ...store, live_url: liveUrl, status: 'PUBLISHED' }
            });

         } catch (e: any) {
            logger.error('generateStore', 'Demo creation failed', e);
            return response(500, { error: 'Failed to create demo store: ' + e.message });
         }
      }

      // Generate website using AI. Default: mode=fallback (fast, no timeout). Set AI_USE_BEDROCK=true to try Bedrock.
      const useBedrock = process.env.AI_USE_BEDROCK === 'true';
      logger.info('generateStore', 'Calling AI service for website generation', { storeId, useBedrock });

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
            storeId,
            ...(useBedrock ? {} : { mode: 'fallback' }),
         });
      } catch (aiError: any) {
         logger.error('generateStore', 'AI service call failed', aiError, { storeId, tenantId });
         throw new Error(aiError.message || 'AI generation failed');
      }

      if (!aiResponse.success || !aiResponse.data) {
         const aiErr = aiResponse.error || aiResponse.details || 'AI generation failed';
         logger.error('generateStore', 'AI generation returned unsuccessful response', undefined, {
            storeId,
            tenantId,
            error: aiErr,
         });
         return response(502, { error: String(aiErr) });
      }

      const website = aiResponse.data as { html?: string; css?: string; config?: unknown };
      if (!website.html || typeof website.html !== 'string') {
         logger.error('generateStore', 'AI response missing html');
         return response(502, { error: 'Invalid AI response: missing html' });
      }
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
               Body: typeof website.css === 'string' ? website.css : '',
               ContentType: 'text/css',
            })),
            s3Client.send(new PutObjectCommand({
               Bucket: S3_BUCKET,
               Key: `${draftPath}/config.json`,
               Body: JSON.stringify(website.config ?? {}, null, 2),
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
         const cfg = (website.config || {}) as { sections?: { type?: string; content?: { products?: unknown[] } }[] };
         const sections = Array.isArray(cfg.sections) ? cfg.sections : [];
         const productSection = sections.find((s: any) => s?.type === 'products');
         if (productSection?.content && Array.isArray(productSection.content.products)) {
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
