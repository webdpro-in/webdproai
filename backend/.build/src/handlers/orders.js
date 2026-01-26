"use strict";
/**
 * WebDPro Backend - Order Handlers
 * Handle customer orders from generated stores
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
exports.updateOrderStatus = exports.getStoreOrders = exports.getOrder = exports.createOrder = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_sns_1 = require("@aws-sdk/client-sns");
const uuid_1 = require("uuid");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new client_sns_1.SNSClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const ORDERS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-orders`;
const PRODUCTS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-products`;
const STORES_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-stores`;
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
/**
 * POST /orders
 * Create a new order (from customer storefront)
 */
const createOrder = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const body = JSON.parse(event.body || '{}');
        // Validate required fields
        const required = ['store_id', 'items', 'customer_name', 'customer_phone', 'delivery_address', 'payment_method'];
        for (const field of required) {
            if (!body[field]) {
                return response(400, { error: `${field} is required` });
            }
        }
        if (!body.items.length) {
            return response(400, { error: 'Order must have at least one item' });
        }
        // Get store to find tenant_id
        const storeResult = yield docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: STORES_TABLE,
            IndexName: 'store-index',
            KeyConditionExpression: 'store_id = :storeId',
            ExpressionAttributeValues: { ':storeId': body.store_id },
            Limit: 1,
        }));
        const store = (_a = storeResult.Items) === null || _a === void 0 ? void 0 : _a[0];
        if (!store) {
            return response(400, { error: 'Store not found' });
        }
        const tenantId = store.tenant_id;
        // Fetch products and calculate totals
        const orderItems = [];
        let subtotal = 0;
        for (const item of body.items) {
            const productResult = yield docClient.send(new lib_dynamodb_1.GetCommand({
                TableName: PRODUCTS_TABLE,
                Key: { tenant_id: tenantId, product_id: item.product_id },
            }));
            const product = productResult.Item;
            if (!product || product.store_id !== body.store_id) {
                return response(400, { error: `Product ${item.product_id} not found` });
            }
            if (!product.is_active) {
                return response(400, { error: `Product ${product.name} is not available` });
            }
            if (product.stock_quantity < item.quantity) {
                return response(400, {
                    error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`
                });
            }
            const itemTotal = product.price * item.quantity;
            orderItems.push({
                product_id: item.product_id,
                name: product.name,
                quantity: item.quantity,
                price: product.price,
                total: itemTotal,
            });
            subtotal += itemTotal;
        }
        // Calculate delivery and total
        const deliveryFee = subtotal >= 500 ? 0 : 40; // Free delivery over ₹500
        const totalAmount = subtotal + deliveryFee;
        // Create order
        const orderId = (0, uuid_1.v4)();
        const order = {
            tenant_id: tenantId,
            order_id: orderId,
            store_id: body.store_id,
            status: 'PENDING_PAYMENT',
            items: orderItems,
            item_count: orderItems.length,
            subtotal,
            delivery_fee: deliveryFee,
            total_amount: totalAmount,
            currency: 'INR',
            customer_name: body.customer_name,
            customer_phone: body.customer_phone,
            delivery_address: body.delivery_address,
            payment_method: body.payment_method,
            payment_status: 'PENDING',
            notes: body.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        yield docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: ORDERS_TABLE,
            Item: order,
        }));
        // For COD, mark as confirmed immediately and trigger inventory deduction
        if (body.payment_method === 'COD') {
            yield docClient.send(new lib_dynamodb_1.UpdateCommand({
                TableName: ORDERS_TABLE,
                Key: { tenant_id: tenantId, order_id: orderId },
                UpdateExpression: 'SET #status = :status, payment_status = :payStatus, updated_at = :time',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: {
                    ':status': 'CONFIRMED',
                    ':payStatus': 'COD_PENDING',
                    ':time': new Date().toISOString(),
                },
            }));
            // Publish ORDER_PLACED event for inventory deduction
            yield publishEvent('ORDER_PLACED', {
                tenantId,
                storeId: body.store_id,
                orderId,
                items: body.items,
                totalAmount,
                paymentMethod: 'COD'
            });
            return response(201, {
                success: true,
                message: 'Order placed successfully (COD)',
                order: {
                    order_id: orderId,
                    status: 'CONFIRMED',
                    total_amount: totalAmount,
                    payment_method: 'COD',
                },
            });
        }
        // For online payment, return order with payment pending
        return response(201, {
            success: true,
            message: 'Order created - proceed to payment',
            order: {
                order_id: orderId,
                status: 'PENDING_PAYMENT',
                total_amount: totalAmount,
                payment_method: body.payment_method,
            },
            payment_required: true,
        });
    }
    catch (error) {
        console.error('Error creating order:', error);
        return response(500, { error: error.message || 'Failed to create order' });
    }
});
exports.createOrder = createOrder;
/**
 * GET /orders/{orderId}
 * Get order details
 */
const getOrder = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const orderId = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.orderId;
        if (!orderId) {
            return response(400, { error: 'Order ID is required' });
        }
        // We need tenant_id to query, but for public order lookup, we'll scan
        // In production, you might want to use a GSI on order_id
        const result = yield docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: ORDERS_TABLE,
            IndexName: 'order-index', // Assuming GSI on order_id
            KeyConditionExpression: 'order_id = :orderId',
            ExpressionAttributeValues: { ':orderId': orderId },
            Limit: 1,
        }));
        if (!((_b = result.Items) === null || _b === void 0 ? void 0 : _b.length)) {
            return response(404, { error: 'Order not found' });
        }
        return response(200, {
            success: true,
            order: result.Items[0],
        });
    }
    catch (error) {
        console.error('Error fetching order:', error);
        return response(500, { error: 'Failed to fetch order' });
    }
});
exports.getOrder = getOrder;
/**
 * GET /stores/{storeId}/orders
 * Get all orders for a store (merchant view)
 */
const getStoreOrders = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const storeId = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.storeId;
        const status = (_b = event.queryStringParameters) === null || _b === void 0 ? void 0 : _b.status;
        const tenantId = getTenantId(event);
        if (!storeId) {
            return response(400, { error: 'Store ID is required' });
        }
        if (!tenantId) {
            return response(401, { error: 'Unauthorized - tenant not found' });
        }
        let filterExpression = 'store_id = :storeId';
        const expressionValues = { ':storeId': storeId };
        if (status) {
            filterExpression += ' AND #status = :status';
            expressionValues[':status'] = status;
        }
        const result = yield docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: ORDERS_TABLE,
            KeyConditionExpression: 'tenant_id = :tenantId',
            FilterExpression: filterExpression,
            ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
            ExpressionAttributeValues: Object.assign({ ':tenantId': tenantId }, expressionValues),
            ScanIndexForward: false, // Newest first
        }));
        return response(200, {
            success: true,
            orders: result.Items || [],
            count: result.Count || 0,
        });
    }
    catch (error) {
        console.error('Error fetching orders:', error);
        return response(500, { error: 'Failed to fetch orders' });
    }
});
exports.getStoreOrders = getStoreOrders;
/**
 * PUT /orders/{orderId}/status
 * Update order status (merchant action)
 */
const updateOrderStatus = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const orderId = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.orderId;
        const tenantId = getTenantId(event);
        const body = JSON.parse(event.body || '{}');
        const { status, notes } = body;
        if (!orderId || !status) {
            return response(400, { error: 'Order ID and status are required' });
        }
        if (!tenantId) {
            return response(401, { error: 'Unauthorized - tenant not found' });
        }
        const validStatuses = [
            'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP',
            'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'
        ];
        if (!validStatuses.includes(status)) {
            return response(400, { error: 'Invalid status' });
        }
        const updateExpressions = ['#status = :status', 'updated_at = :time'];
        const expressionValues = {
            ':status': status,
            ':time': new Date().toISOString(),
        };
        if (notes) {
            updateExpressions.push('status_notes = :notes');
            expressionValues[':notes'] = notes;
        }
        if (status === 'DELIVERED') {
            updateExpressions.push('delivered_at = :time');
        }
        yield docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: ORDERS_TABLE,
            Key: { tenant_id: tenantId, order_id: orderId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: expressionValues,
        }));
        // Publish status change events
        if (status === 'DELIVERED') {
            yield publishEvent('DELIVERY_COMPLETED', {
                tenantId,
                orderId,
                deliveredAt: new Date().toISOString()
            });
        }
        else if (status === 'CANCELLED') {
            // Get order details to restore inventory
            const orderResult = yield docClient.send(new lib_dynamodb_1.GetCommand({
                TableName: ORDERS_TABLE,
                Key: { tenant_id: tenantId, order_id: orderId },
            }));
            if (orderResult.Item) {
                yield publishEvent('ORDER_CANCELLED', {
                    tenantId,
                    storeId: orderResult.Item.store_id,
                    orderId,
                    items: orderResult.Item.items.map((item) => ({
                        product_id: item.product_id,
                        quantity: item.quantity
                    }))
                });
            }
        }
        return response(200, {
            success: true,
            message: `Order status updated to ${status}`,
        });
    }
    catch (error) {
        console.error('Error updating order:', error);
        return response(500, { error: 'Failed to update order' });
    }
});
exports.updateOrderStatus = updateOrderStatus;
// Helper: Get tenant ID from token
function getTenantId(event) {
    var _a, _b, _c;
    return ((_c = (_b = (_a = event.requestContext) === null || _a === void 0 ? void 0 : _a.authorizer) === null || _b === void 0 ? void 0 : _b.claims) === null || _c === void 0 ? void 0 : _c['custom:tenant_id']) || null;
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
