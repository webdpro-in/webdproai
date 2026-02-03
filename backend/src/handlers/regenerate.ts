
/**
 * POST /stores/{storeId}/regenerate
 * Regenerate website HTML from current config (SiteSpec)
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { aiClient } from '../lib/ai-client';
import { logger } from '../lib/logger';
import { getTenantId, response, APIGatewayEvent } from '../lib/utils';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-north-1' });

const STORES_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-stores`;
const S3_BUCKET = process.env.S3_BUCKET || 'webdpro-ai';


export const regenerateStore = async (event: APIGatewayEvent) => {
   const tenantId = getTenantId(event);
   const storeId = event.pathParameters?.storeId;

   if (!tenantId || !storeId) {
      return response(400, { error: 'Missing tenantId or storeId' });
   }

   try {
      // 1. Get current store config
      const storeRes = await docClient.send(new GetCommand({
         TableName: STORES_TABLE,
         Key: { tenant_id: tenantId, store_id: storeId }
      }));

      if (!storeRes.Item || !storeRes.Item.config) {
         return response(404, { error: 'Store or config not found' });
      }

      const currentConfig = storeRes.Item.config;

      // 2. Allow optional config update in body
      let newConfig = currentConfig;
      if (event.body) {
         try {
            const body = JSON.parse(event.body);
            if (body.config) {
               newConfig = { ...currentConfig, ...body.config };
               // Update DB with new config immediately
               await docClient.send(new UpdateCommand({
                  TableName: STORES_TABLE,
                  Key: { tenant_id: tenantId, store_id: storeId },
                  UpdateExpression: 'SET config = :config, updated_at = :now',
                  ExpressionAttributeValues: {
                     ':config': newConfig,
                     ':now': new Date().toISOString()
                  }
               }));
            }
         } catch (e) { }
      }

      logger.info('regenerateStore', 'Regenerating HTML from config', { storeId });

      // 3. Check for Demo Mode
      if (storeRes.Item.is_demo === true) {
         logger.info('regenerateStore', 'Demo mode detected. Using Cheerio generator.', { storeId });

         const cheerio = require('cheerio');
         // We might need to fetch the existing HTML first (or template)
         // But for simplicity, let's fetch the CURRENT draft HTML to apply changes on top
         const draftKey = `drafts/${tenantId}/${storeId}/index.html`;

         // Fetch HTML
         const getObj = await s3Client.send(new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: draftKey
         }));
         const str = await getObj.Body?.transformToString();

         if (!str) throw new Error("Could not load existing demo HTML");

         const $ = cheerio.load(str);

         // Apply updates from config
         if (newConfig.sections) {
            newConfig.sections.forEach((section: any) => {
               const id = section.id || section.type;
               // Select section by data-section-id attribute
               const $el = $(`[data-section-id="${id}"]`);

               if ($el.length && section.content) {
                  // Text updates (Generalized)
                  if (section.content.title) $el.find('h1, h2, h3').first().text(section.content.title);
                  if (section.content.subtitle) $el.find('p').first().text(section.content.subtitle);
                  if (section.content.description) $el.find('p').first().text(section.content.description);

                  // Image updates
                  if (section.content.image) {
                     $el.find('img').first().attr('src', section.content.image);
                     // Handle background images if any (often inline styles for hero)
                  }

                  // Specific adjustments based on section type
                  if (id === 'hero' && section.content.headline) {
                     $el.find('h1').text(section.content.headline);
                  }
               }
            });
         }

         const newHtml = $.html();

         // 4. Upload to S3 Drafts AND Production (since demo is effectively "live")
         // But to stick to flow, we update draft, and user clicks "Publish". 
         // But `generateStore` sets demo to PUBLISHED. So we should update BOTH.
         // Actually, let's stick to draft flow, but since it's demo, maybe just update draft.
         // Wait, the prompt says "Reflect on the demo website... See real site updates live". 
         // So we should update the live path too if it's published.

         const uploads = [
            s3Client.send(new PutObjectCommand({
               Bucket: S3_BUCKET,
               Key: draftKey,
               Body: newHtml,
               ContentType: 'text/html'
            }))
         ];

         if (storeRes.Item.status === 'PUBLISHED') {
            uploads.push(s3Client.send(new PutObjectCommand({
               Bucket: S3_BUCKET,
               Key: `stores/${storeId}/index.html`,
               Body: newHtml,
               ContentType: 'text/html'
            })));
         }

         await Promise.all(uploads);

         return response(200, {
            success: true,
            message: 'Website updated (Demo Mode)',
            preview_url: `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${draftKey}`
         });

      }

      // 3. Call AI Service to Generate Code (Non-Demo)
      const codeRes = await aiClient.generateCode(newConfig, tenantId, storeId);

      if (!codeRes.success || !codeRes.data || !codeRes.data.html) {
         throw new Error(codeRes.error || 'Code generation failed');
      }

      const { html, css } = codeRes.data;

      // 4. Upload to S3 Drafts
      const draftPath = `drafts/${tenantId}/${storeId}`;
      await Promise.all([
         s3Client.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: `${draftPath}/index.html`,
            Body: html,
            ContentType: 'text/html'
         })),
         s3Client.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: `${draftPath}/styles.css`,
            Body: css || '',
            ContentType: 'text/css'
         }))
      ]);

      return response(200, {
         success: true,
         message: 'Website regenerated',
         preview_url: `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${draftPath}/index.html`
      });

   } catch (error: any) {
      logger.error('regenerateStore', 'Failed', error);
      return response(500, { error: error.message });
   }
};
