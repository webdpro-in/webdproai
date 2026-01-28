/**
 * Step 4: Website Generator (Publisher)
 * Role: Publisher (Infrastructure)
 * Action: Uploads generated assets to S3 and updates Registry
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SiteSpec } from "../schemas";

const s3 = new S3Client({ region: process.env.AWS_S3_REGION || "eu-north-1" });
const dbClient = new DynamoDBClient({ region: process.env.AWS_CORE_REGION || "eu-north-1" });
const docClient = DynamoDBDocumentClient.from(dbClient);

const S3_BUCKET = process.env.AWS_S3_BUCKET || "webdpro-ai-storage";
const STORES_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX || 'webdpro'}-stores`;

interface GeneratedAssets {
   html: string;
   css?: string;
   images: Record<string, string>; // Map of sectionId -> S3 URL
}

export async function publishWebsite(
   spec: SiteSpec,
   headers: GeneratedAssets,
   tenantId: string,
   storeId: string
) {
   console.log(`Publishing website for Store: ${storeId} (Tenant: ${tenantId})...`);

   const basePath = `merchants/${tenantId}/${storeId}/website`;

   // 1. Upload HTML
   // We embed the config/spec directly into the HTML or as a separate JSON
   // For this MVP, we assume the HTML is fully self-contained or fetches config.
   // We'll upload index.html

   await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: `${basePath}/index.html`,
      Body: headers.html,
      ContentType: 'text/html',
      CacheControl: 'no-cache' // For dev, we want instant updates
   }));

   // 2. Upload Config (Optional but good for hydration)
   await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: `${basePath}/config.json`,
      Body: JSON.stringify(spec),
      ContentType: 'application/json'
   }));

   // 3. Construct Public URL
   // Domain: https://<bucket>.s3.<region>.amazonaws.com/merchants/...
   // OR CloudFront URL if configured (Production)
   const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
   const publicUrl = cloudfrontDomain
      ? `https://${cloudfrontDomain}/${basePath}/index.html`
      : `https://${S3_BUCKET}.s3.${process.env.AWS_S3_REGION || 'eu-north-1'}.amazonaws.com/${basePath}/index.html`;

   // 4. Update Registry (DynamoDB)
   await docClient.send(new UpdateCommand({
      TableName: STORES_TABLE,
      Key: { tenant_id: tenantId, store_id: storeId },
      UpdateExpression: 'SET live_url = :url, status = :status, published_at = :now, updated_at = :now',
      ExpressionAttributeValues: {
         ':url': publicUrl,
         ':status': 'PUBLISHED',
         ':now': new Date().toISOString()
      }
   }));

   console.log(`Website published successfully: ${publicUrl}`);
   return {
      success: true,
      url: publicUrl
   };
}
