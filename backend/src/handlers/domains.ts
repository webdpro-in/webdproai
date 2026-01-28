/**
 * WebDPro Backend - Domain Management Handlers
 * Connect custom domains to stores via Hostinger API
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ACMClient, RequestCertificateCommand, DescribeCertificateCommand } from '@aws-sdk/client-acm';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const acmClient = new ACMClient({ region: 'us-east-1' }); // ACM for CloudFront must be in us-east-1

const STORES_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-stores`;

interface APIGatewayEvent {
   pathParameters?: { storeId?: string };
   body: string | null;
   requestContext?: { authorizer?: { claims?: { 'custom:tenant_id'?: string } } };
}

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

const getTenantId = (event: APIGatewayEvent): string | null => {
   return event.requestContext?.authorizer?.claims?.['custom:tenant_id'] || null;
};

/**
 * POST /stores/{storeId}/domain
 * Connect custom domain to store
 */
export const connectDomain = async (event: APIGatewayEvent) => {
   try {
      const tenantId = getTenantId(event);
      const storeId = event.pathParameters?.storeId;
      const body = JSON.parse(event.body || '{}');
      const { domain } = body;

      if (!tenantId || !storeId || !domain) {
         return response(400, { error: 'Missing required parameters' });
      }

      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
         return response(400, { error: 'Invalid domain format' });
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

      if (store.status !== 'PUBLISHED') {
         return response(400, { error: 'Store must be published before connecting domain' });
      }

      // Step 1: Request SSL Certificate
      console.log(`[Domain] Requesting SSL certificate for ${domain}`);
      const certResponse = await acmClient.send(new RequestCertificateCommand({
         DomainName: domain,
         ValidationMethod: 'DNS',
         SubjectAlternativeNames: [`www.${domain}`],
      }));

      const certificateArn = certResponse.CertificateArn;

      // Step 2: Get DNS validation records
      const certDetails = await acmClient.send(new DescribeCertificateCommand({
         CertificateArn: certificateArn,
      }));

      const dnsValidationRecords = certDetails.Certificate?.DomainValidationOptions?.map(option => ({
         name: option.ResourceRecord?.Name,
         type: option.ResourceRecord?.Type,
         value: option.ResourceRecord?.Value,
      })) || [];

      // Step 3: Update store with domain connection status
      await docClient.send(new UpdateCommand({
         TableName: STORES_TABLE,
         Key: { tenant_id: tenantId, store_id: storeId },
         UpdateExpression: 'SET custom_domain = :domain, domain_status = :status, certificate_arn = :cert, dns_records = :dns, updated_at = :time',
         ExpressionAttributeValues: {
            ':domain': domain,
            ':status': 'PENDING_VALIDATION',
            ':cert': certificateArn,
            ':dns': dnsValidationRecords,
            ':time': new Date().toISOString(),
         },
      }));

      return response(200, {
         success: true,
         message: 'Domain connection initiated',
         domain,
         status: 'PENDING_VALIDATION',
         dns_records: dnsValidationRecords,
         instructions: {
            step1: 'Add the DNS validation records to your domain DNS settings',
            step2: 'Add a CNAME record pointing your domain to the CloudFront distribution',
            step3: 'Wait for SSL certificate validation (can take up to 24 hours)',
         },
      });
   } catch (error: any) {
      console.error('Error connecting domain:', error);
      return response(500, { error: error.message || 'Failed to connect domain' });
   }
};

/**
 * GET /stores/{storeId}/domain/status
 * Check domain connection status
 */
export const getDomainStatus = async (event: APIGatewayEvent) => {
   try {
      const tenantId = getTenantId(event);
      const storeId = event.pathParameters?.storeId;

      if (!tenantId || !storeId) {
         return response(400, { error: 'Missing required parameters' });
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

      if (!store.custom_domain) {
         return response(200, {
            success: true,
            domain_connected: false,
            message: 'No custom domain configured',
         });
      }

      // Check certificate status if available
      let certificateStatus = 'UNKNOWN';
      if (store.certificate_arn) {
         try {
            const certDetails = await acmClient.send(new DescribeCertificateCommand({
               CertificateArn: store.certificate_arn,
            }));
            certificateStatus = certDetails.Certificate?.Status || 'UNKNOWN';
         } catch (error) {
            console.warn('Failed to check certificate status:', error);
         }
      }

      return response(200, {
         success: true,
         domain_connected: store.domain_status === 'ACTIVE',
         domain: store.custom_domain,
         status: store.domain_status,
         certificate_status: certificateStatus,
         dns_records: store.dns_records || [],
      });
   } catch (error: any) {
      console.error('Error checking domain status:', error);
      return response(500, { error: error.message || 'Failed to check domain status' });
   }
};

/**
 * POST /stores/{storeId}/domain/verify
 * Verify domain and activate if ready
 */
export const verifyDomain = async (event: APIGatewayEvent) => {
   try {
      const tenantId = getTenantId(event);
      const storeId = event.pathParameters?.storeId;

      if (!tenantId || !storeId) {
         return response(400, { error: 'Missing required parameters' });
      }

      // Get store
      const storeResult = await docClient.send(new GetCommand({
         TableName: STORES_TABLE,
         Key: { tenant_id: tenantId, store_id: storeId },
      }));

      const store = storeResult.Item;
      if (!store || !store.custom_domain || !store.certificate_arn) {
         return response(400, { error: 'Domain not configured or certificate missing' });
      }

      // Check certificate status
      const certDetails = await acmClient.send(new DescribeCertificateCommand({
         CertificateArn: store.certificate_arn,
      }));

      const certificateStatus = certDetails.Certificate?.Status;
      if (certificateStatus !== 'ISSUED') {
         return response(400, {
            error: 'Certificate not yet issued',
            certificate_status: certificateStatus,
            message: 'Please wait for DNS validation to complete',
         });
      }

      // Certificate is ready, update CloudFront distribution
      // Note: This is a simplified version. In production, you'd need to:
      // 1. Create/update CloudFront distribution with custom domain
      // 2. Update DNS to point to CloudFront
      // 3. Test domain accessibility

      await docClient.send(new UpdateCommand({
         TableName: STORES_TABLE,
         Key: { tenant_id: tenantId, store_id: storeId },
         UpdateExpression: 'SET domain_status = :status, updated_at = :time',
         ExpressionAttributeValues: {
            ':status': 'ACTIVE',
            ':time': new Date().toISOString(),
         },
      }));

      return response(200, {
         success: true,
         message: 'Domain verified and activated',
         domain: store.custom_domain,
         status: 'ACTIVE',
         live_url: `https://${store.custom_domain}`,
      });
   } catch (error: any) {
      console.error('Error verifying domain:', error);
      return response(500, { error: error.message || 'Failed to verify domain' });
   }
};
