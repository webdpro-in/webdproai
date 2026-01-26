"use strict";
/**
 * WebDPro Backend - Payment Handlers
 * Razorpay integration for payments
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.handleWebhook = exports.verifyPayment = exports.createPayment = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto = __importStar(require("crypto"));
const dynamoClient = new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const ORDERS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-orders`;
const PAYMENTS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-payments`;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
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
 * POST /payments/create/{orderId}
 * Create Razorpay order for payment
 */
const createPayment = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const orderId = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.orderId;
        if (!orderId) {
            return response(400, { error: 'Order ID is required' });
        }
        // Get order
        const orderResult = yield docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: ORDERS_TABLE,
            Key: { order_id: orderId },
        }));
        const order = orderResult.Item;
        if (!order) {
            return response(404, { error: 'Order not found' });
        }
        if (order.payment_status === 'PAID') {
            return response(400, { error: 'Order already paid' });
        }
        // Create Razorpay order
        const razorpayOrder = yield createRazorpayOrder({
            amount: order.total_amount * 100, // Convert to paise
            currency: 'INR',
            receipt: orderId,
            notes: {
                order_id: orderId,
                store_id: order.store_id,
            },
        });
        // Save payment reference
        yield docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: PAYMENTS_TABLE,
            Item: {
                tenant_id: order.tenant_id,
                payment_id: razorpayOrder.id,
                order_id: orderId,
                razorpay_order_id: razorpayOrder.id,
                amount: order.total_amount,
                currency: 'INR',
                status: 'CREATED',
                created_at: new Date().toISOString(),
            },
        }));
        return response(200, {
            success: true,
            razorpay: {
                key: RAZORPAY_KEY_ID,
                order_id: razorpayOrder.id,
                amount: order.total_amount * 100,
                currency: 'INR',
                name: 'WebDPro Store',
                description: `Order #${orderId.substring(0, 8)}`,
                prefill: {
                    name: order.customer_name,
                    contact: order.customer_phone,
                },
            },
        });
    }
    catch (error) {
        console.error('Error creating payment:', error);
        return response(500, { error: error.message || 'Failed to create payment' });
    }
});
exports.createPayment = createPayment;
/**
 * POST /payments/verify
 * Verify Razorpay payment signature
 */
const verifyPayment = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = JSON.parse(event.body || '{}');
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return response(400, { error: 'Payment verification details required' });
        }
        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');
        if (generatedSignature !== razorpay_signature) {
            return response(400, { error: 'Invalid payment signature' });
        }
        // Update payment record
        yield docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: PAYMENTS_TABLE,
            Key: { payment_id: razorpay_order_id },
            UpdateExpression: 'SET #status = :status, razorpay_payment_id = :paymentId, verified_at = :time',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':status': 'CAPTURED',
                ':paymentId': razorpay_payment_id,
                ':time': new Date().toISOString(),
            },
        }));
        // Update order status
        if (order_id) {
            yield docClient.send(new lib_dynamodb_1.UpdateCommand({
                TableName: ORDERS_TABLE,
                Key: { order_id: order_id },
                UpdateExpression: 'SET #status = :status, payment_status = :payStatus, razorpay_payment_id = :paymentId, paid_at = :time, updated_at = :time',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: {
                    ':status': 'CONFIRMED',
                    ':payStatus': 'PAID',
                    ':paymentId': razorpay_payment_id,
                    ':time': new Date().toISOString(),
                },
            }));
        }
        return response(200, {
            success: true,
            message: 'Payment verified successfully',
        });
    }
    catch (error) {
        console.error('Error verifying payment:', error);
        return response(500, { error: error.message || 'Payment verification failed' });
    }
});
exports.verifyPayment = verifyPayment;
/**
 * POST /payments/webhook
 * Handle Razorpay webhooks
 */
const handleWebhook = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const signature = event.headers['x-razorpay-signature'];
        const body = event.body || '';
        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');
        if (signature !== expectedSignature) {
            console.error('Invalid webhook signature');
            return response(400, { error: 'Invalid signature' });
        }
        const payload = JSON.parse(body);
        const eventType = payload.event;
        console.log(`[Webhook] Received event: ${eventType}`);
        switch (eventType) {
            case 'payment.captured':
                yield handlePaymentCaptured(payload.payload.payment.entity);
                break;
            case 'payment.failed':
                yield handlePaymentFailed(payload.payload.payment.entity);
                break;
            case 'refund.created':
                yield handleRefundCreated(payload.payload.refund.entity);
                break;
            default:
                console.log(`[Webhook] Unhandled event: ${eventType}`);
        }
        return response(200, { received: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        return response(500, { error: 'Webhook processing failed' });
    }
});
exports.handleWebhook = handleWebhook;
// Helper: Handle payment captured
function handlePaymentCaptured(payment) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const orderId = (_a = payment.notes) === null || _a === void 0 ? void 0 : _a.order_id;
        if (!orderId)
            return;
        yield docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: ORDERS_TABLE,
            Key: { order_id: orderId },
            UpdateExpression: 'SET #status = :status, payment_status = :payStatus, paid_at = :time, updated_at = :time',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':status': 'CONFIRMED',
                ':payStatus': 'PAID',
                ':time': new Date().toISOString(),
            },
        }));
        console.log(`[Payment] Captured for order ${orderId}`);
    });
}
// Helper: Handle payment failed
function handlePaymentFailed(payment) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const orderId = (_a = payment.notes) === null || _a === void 0 ? void 0 : _a.order_id;
        if (!orderId)
            return;
        yield docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: ORDERS_TABLE,
            Key: { order_id: orderId },
            UpdateExpression: 'SET payment_status = :payStatus, payment_error = :error, updated_at = :time',
            ExpressionAttributeValues: {
                ':payStatus': 'FAILED',
                ':error': payment.error_description || 'Payment failed',
                ':time': new Date().toISOString(),
            },
        }));
        console.log(`[Payment] Failed for order ${orderId}`);
    });
}
// Helper: Handle refund created
function handleRefundCreated(refund) {
    return __awaiter(this, void 0, void 0, function* () {
        const paymentId = refund.payment_id;
        console.log(`[Refund] Created for payment ${paymentId}`);
    });
}
// Helper: Create Razorpay order (HTTP call)
function createRazorpayOrder(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        const response = yield fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(options),
        });
        if (!response.ok) {
            const error = yield response.text();
            throw new Error(`Razorpay error: ${error}`);
        }
        return response.json();
    });
}
