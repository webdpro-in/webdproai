"use strict";
/**
 * WebDPro Backend - Auth Handlers
 * AWS Cognito integration for OTP-based authentication
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
exports.getProfile = exports.refreshToken = exports.verifyOTP = exports.requestOTP = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
    region: process.env.AWS_REGION || 'eu-north-1'
});
const dynamoClient = new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const USERS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-users`;
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
 * POST /auth/otp/request
 * Request OTP for phone number
 */
const requestOTP = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = JSON.parse(event.body || '{}');
        const { phone, role = 'CUSTOMER' } = body;
        if (!phone) {
            return response(400, { error: 'Phone number is required' });
        }
        // Normalize phone number (add +91 if not present)
        const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        // Check if user exists, if not create
        let userExists = false;
        try {
            yield cognitoClient.send(new client_cognito_identity_provider_1.AdminGetUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: normalizedPhone,
            }));
            userExists = true;
        }
        catch (err) {
            if (err.name !== 'UserNotFoundException') {
                throw err;
            }
        }
        if (!userExists) {
            // Create new user (Cognito will send OTP)
            yield cognitoClient.send(new client_cognito_identity_provider_1.AdminCreateUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: normalizedPhone,
                UserAttributes: [
                    { Name: 'phone_number', Value: normalizedPhone },
                    { Name: 'phone_number_verified', Value: 'true' },
                    { Name: 'custom:role', Value: role },
                ],
                MessageAction: 'SUPPRESS', // We'll handle OTP ourselves
            }));
        }
        // Initiate custom auth flow (OTP)
        const authResponse = yield cognitoClient.send(new client_cognito_identity_provider_1.InitiateAuthCommand({
            AuthFlow: 'CUSTOM_AUTH',
            ClientId: CLIENT_ID,
            AuthParameters: {
                USERNAME: normalizedPhone,
            },
        }));
        return response(200, {
            success: true,
            message: 'OTP sent successfully',
            session: authResponse.Session,
            challenge: authResponse.ChallengeName,
        });
    }
    catch (error) {
        console.error('Error requesting OTP:', error);
        return response(500, { error: error.message || 'Failed to send OTP' });
    }
});
exports.requestOTP = requestOTP;
/**
 * POST /auth/otp/verify
 * Verify OTP and return tokens
 */
const verifyOTP = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = JSON.parse(event.body || '{}');
        const { phone, otp, session } = body;
        if (!phone || !otp || !session) {
            return response(400, { error: 'Phone, OTP, and session are required' });
        }
        const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        // Verify OTP
        const authResponse = yield cognitoClient.send(new client_cognito_identity_provider_1.RespondToAuthChallengeCommand({
            ClientId: CLIENT_ID,
            ChallengeName: 'CUSTOM_CHALLENGE',
            Session: session,
            ChallengeResponses: {
                USERNAME: normalizedPhone,
                ANSWER: otp,
            },
        }));
        if (!authResponse.AuthenticationResult) {
            return response(401, { error: 'Invalid OTP' });
        }
        // Get or create user profile
        let user = yield getUserProfile(normalizedPhone);
        if (!user) {
            user = yield createUserProfile(normalizedPhone, body.role || 'CUSTOMER');
        }
        return response(200, {
            success: true,
            message: 'Login successful',
            tokens: {
                accessToken: authResponse.AuthenticationResult.AccessToken,
                idToken: authResponse.AuthenticationResult.IdToken,
                refreshToken: authResponse.AuthenticationResult.RefreshToken,
                expiresIn: authResponse.AuthenticationResult.ExpiresIn,
            },
            user: {
                id: user.user_id,
                phone: user.phone,
                role: user.role,
                name: user.name,
            },
        });
    }
    catch (error) {
        console.error('Error verifying OTP:', error);
        return response(401, { error: 'Invalid or expired OTP' });
    }
});
exports.verifyOTP = verifyOTP;
/**
 * POST /auth/refresh
 * Refresh access token
 */
const refreshToken = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const body = JSON.parse(event.body || '{}');
        const { refreshToken } = body;
        if (!refreshToken) {
            return response(400, { error: 'Refresh token is required' });
        }
        const authResponse = yield cognitoClient.send(new client_cognito_identity_provider_1.InitiateAuthCommand({
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            ClientId: CLIENT_ID,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken,
            },
        }));
        return response(200, {
            success: true,
            tokens: {
                accessToken: (_a = authResponse.AuthenticationResult) === null || _a === void 0 ? void 0 : _a.AccessToken,
                idToken: (_b = authResponse.AuthenticationResult) === null || _b === void 0 ? void 0 : _b.IdToken,
                expiresIn: (_c = authResponse.AuthenticationResult) === null || _c === void 0 ? void 0 : _c.ExpiresIn,
            },
        });
    }
    catch (error) {
        console.error('Error refreshing token:', error);
        return response(401, { error: 'Invalid refresh token' });
    }
});
exports.refreshToken = refreshToken;
/**
 * GET /auth/profile
 * Get user profile from token
 */
const getProfile = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Extract user info from authorizer context
        const claims = (_b = (_a = event.requestContext) === null || _a === void 0 ? void 0 : _a.authorizer) === null || _b === void 0 ? void 0 : _b.claims;
        if (!claims) {
            return response(401, { error: 'Unauthorized' });
        }
        const phone = claims.phone_number || claims['cognito:username'];
        const user = yield getUserProfile(phone);
        if (!user) {
            return response(404, { error: 'User profile not found' });
        }
        return response(200, {
            success: true,
            user,
        });
    }
    catch (error) {
        console.error('Error getting profile:', error);
        return response(500, { error: 'Failed to get profile' });
    }
});
exports.getProfile = getProfile;
// Helper: Get user profile from DynamoDB
function getUserProfile(phone) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield docClient.send(new lib_dynamodb_1.GetCommand({
                TableName: USERS_TABLE,
                Key: { phone },
            }));
            return result.Item;
        }
        catch (_a) {
            return null;
        }
    });
}
// Helper: Create user profile in DynamoDB
function createUserProfile(phone, role) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = {
            user_id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            phone,
            role,
            name: null,
            email: null,
            tenant_id: role === 'BUSINESS_OWNER' ? `tenant_${Date.now()}` : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        yield docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: USERS_TABLE,
            Item: user,
        }));
        return user;
    });
}
