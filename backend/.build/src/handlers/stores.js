"use strict";
/**
 * WebDPro Backend - Store Handlers
 * Generate, manage, and deploy AI-generated websites
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStore = exports.publishStore = exports.getStore = exports.getStores = exports.generateStore = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_s3_1 = require("@aws-sdk/client-s3");
const client_cloudfront_1 = require("@aws-sdk/client-cloudfront");
const client_sns_1 = require("@aws-sdk/client-sns");
const uuid_1 = require("uuid");
const ai_client_1 = require("../lib/ai-client");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new client_s3_1.S3Client({ region: process.env.AWS_REGION || 'eu-north-1' });
const cfClient = new client_cloudfront_1.CloudFrontClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const snsClient = new client_sns_1.SNSClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const STORES_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-stores`;
const S3_BUCKET = process.env.S3_BUCKET || 'webdpro-ai';
const CLOUDFRONT_DIST_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const EVENTS_TOPIC_ARN = process.env.EVENTS_TOPIC_ARN;
// Helper: Create response
const response = (statusCode, body) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
});
// Helper: Get tenant ID from token
const getTenantId = (event) => {
    var _a, _b, _c;
    return ((_c = (_b = (_a = event.requestContext) === null || _a === void 0 ? void 0 : _a.authorizer) === null || _b === void 0 ? void 0 : _b.claims) === null || _c === void 0 ? void 0 : _c['custom:tenant_id']) || null;
};
/**
 * POST /stores/generate
 * Generate a new AI-powered website
 */
const generateStore = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenantId = getTenantId(event);
        if (!tenantId) {
            return response(401, { error: 'Unauthorized - tenant not found' });
        }
        const body = JSON.parse(event.body || '{}');
        const { prompt, storeType, language = 'en', currency = 'INR' } = body;
        if (!prompt) {
            return response(400, { error: 'Prompt is required' });
        }
        const storeId = (0, uuid_1.v4)();
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
        yield docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: STORES_TABLE,
            Item: store,
        }));
        // Generate website using AI
        console.log(`[Store ${storeId}] Starting AI generation...`);
        const aiResponse = yield ai_client_1.aiClient.generateWebsite({
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
        yield Promise.all([
            s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: `${draftPath}/index.html`,
                Body: website.html,
                ContentType: 'text/html',
            })),
            s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: `${draftPath}/styles.css`,
                Body: website.css,
                ContentType: 'text/css',
            })),
            s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: `${draftPath}/config.json`,
                Body: JSON.stringify(website.config, null, 2),
                ContentType: 'application/json',
            })),
        ]);
        // Update store status
        yield docClient.send(new lib_dynamodb_1.UpdateCommand({
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
        yield publishEvent('STORE_CREATED', {
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
    }
    catch (error) {
        console.error('Error generating store:', error);
        // Update store status to ERROR
        try {
            yield docClient.send(new lib_dynamodb_1.UpdateCommand({
                TableName: STORES_TABLE,
                Key: { tenant_id: tenantId, store_id: storeId },
                UpdateExpression: 'SET #status = :status, updated_at = :time',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: {
                    ':status': 'ERROR',
                    ':time': new Date().toISOString(),
                },
            }));
        }
        catch (updateError) {
            console.error('Failed to update store status to ERROR:', updateError);
        }
        return response(500, { error: error.message || 'Failed to generate store' });
    }
});
exports.generateStore = generateStore;
/**
 * GET /stores
 * Get all stores for tenant
 */
const getStores = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenantId = getTenantId(event);
        if (!tenantId) {
            return response(401, { error: 'Unauthorized' });
        }
        const result = yield docClient.send(new lib_dynamodb_1.QueryCommand({
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
    }
    catch (error) {
        console.error('Error fetching stores:', error);
        return response(500, { error: 'Failed to fetch stores' });
    }
});
exports.getStores = getStores;
/**
 * GET /stores/{storeId}
 * Get single store details
 */
const getStore = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tenantId = getTenantId(event);
        const storeId = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.storeId;
        if (!tenantId || !storeId) {
            return response(400, { error: 'Store ID required' });
        }
        const result = yield docClient.send(new lib_dynamodb_1.GetCommand({
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
    }
    catch (error) {
        console.error('Error fetching store:', error);
        return response(500, { error: 'Failed to fetch store' });
    }
});
exports.getStore = getStore;
/**
 * POST /stores/{storeId}/publish
 * Publish store to production
 */
const publishStore = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tenantId = getTenantId(event);
        const storeId = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.storeId;
        const body = JSON.parse(event.body || '{}');
        if (!tenantId || !storeId) {
            return response(400, { error: 'Store ID required' });
        }
        // Get store
        const storeResult = yield docClient.send(new lib_dynamodb_1.GetCommand({
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
        yield Promise.all(files.map(file => s3Client.send(new client_s3_1.CopyObjectCommand({
            Bucket: S3_BUCKET,
            CopySource: `${S3_BUCKET}/${draftPath}/${file}`,
            Key: `${prodPath}/${file}`,
        }))));
        // Generate subdomain
        const subdomain = body.subdomain || `store-${storeId.substring(0, 8)}`;
        const liveUrl = `https://${subdomain}.webdpro.in`;
        // Update store status
        yield docClient.send(new lib_dynamodb_1.UpdateCommand({
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
                yield cfClient.send(new client_cloudfront_1.CreateInvalidationCommand({
                    DistributionId: CLOUDFRONT_DIST_ID,
                    InvalidationBatch: {
                        Paths: {
                            Quantity: 1,
                            Items: [`/${prodPath}/*`],
                        },
                        CallerReference: `publish-${storeId}-${Date.now()}`,
                    },
                }));
            }
            catch (cfError) {
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
    }
    catch (error) {
        console.error('Error publishing store:', error);
        return response(500, { error: error.message || 'Failed to publish store' });
    }
});
exports.publishStore = publishStore;
/**
 * PUT /stores/{storeId}
 * Update store configuration
 */
const updateStore = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tenantId = getTenantId(event);
        const storeId = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.storeId;
        const body = JSON.parse(event.body || '{}');
        if (!tenantId || !storeId) {
            return response(400, { error: 'Store ID required' });
        }
        // Get current store
        const storeResult = yield docClient.send(new lib_dynamodb_1.GetCommand({
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
        const updateExpressions = [];
        const expressionValues = {};
        const expressionNames = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateExpressions.push(`#${field} = :${field}`);
                expressionValues[`:${field}`] = body[field];
                expressionNames[`#${field}`] = field;
            }
        }
        updateExpressions.push('updated_at = :time');
        expressionValues[':time'] = new Date().toISOString();
        yield docClient.send(new lib_dynamodb_1.UpdateCommand({
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
    }
    catch (error) {
        console.error('Error updating store:', error);
        return response(500, { error: 'Failed to update store' });
    }
});
exports.updateStore = updateStore;
// Helper: Extract business name from prompt
function extractBusinessName(prompt) {
    const match = prompt.match(/for ([\w\s]+)/i) || prompt.match(/([\w\s]+) -/) || prompt.match(/^([\w\s]+)/);
    return match ? match[1].trim() : "My Business";
}
// Helper: Publish event to SNS
function publishEvent(eventType, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!EVENTS_TOPIC_ARN) {
            console.warn('EVENTS_TOPIC_ARN not configured, skipping event publication');
            return;
        }
        try {
            yield snsClient.send(new client_sns_1.PublishCommand({
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
        }
        catch (error) {
            console.error(`Failed to publish ${eventType} event:`, error);
        }
    });
}
