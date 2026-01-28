/**
 * WebDPro Backend - Auth Handlers
 * AWS Cognito integration for OTP-based authentication and Google OAuth
 */

import {
   CognitoIdentityProviderClient,
   InitiateAuthCommand,
   RespondToAuthChallengeCommand,
   AdminGetUserCommand,
   AdminCreateUserCommand,
   AdminSetUserPasswordCommand,
   GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '../lib/logger';

const cognitoClient = new CognitoIdentityProviderClient({
   region: process.env.AWS_REGION || 'eu-north-1'
});
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;
const USERS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-users`;

interface APIGatewayEvent {
   body: string | null;
   headers: Record<string, string>;
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

/**
 * POST /auth/otp/request
 * Request OTP for phone number
 */
export const requestOTP = async (event: APIGatewayEvent) => {
   try {
      const body = JSON.parse(event.body || '{}');
      const { phone, role = 'CUSTOMER' } = body;

      if (!phone) {
         logger.warn('requestOTP', 'Missing phone number in request');
         return response(400, { error: 'Phone number is required' });
      }

      // Normalize phone number (add +91 if not present)
      const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      logger.info('requestOTP', 'Processing OTP request', { phone: normalizedPhone, role });

      // Check if user exists, if not create
      let userExists = false;
      try {
         await cognitoClient.send(new AdminGetUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: normalizedPhone,
         }));
         userExists = true;
         logger.info('requestOTP', 'User exists in Cognito', { phone: normalizedPhone });
      } catch (err: any) {
         if (err.name !== 'UserNotFoundException') {
            logger.error('requestOTP', 'Cognito AdminGetUser failed', err, { phone: normalizedPhone });
            throw err;
         }
         logger.info('requestOTP', 'User not found, will create new user', { phone: normalizedPhone });
      }

      if (!userExists) {
         // Generate tenant_id for business owners
         const tenantId = role === 'BUSINESS_OWNER' ? `tenant_${Date.now()}` : '';

         // Create new user (Cognito will send OTP)
         try {
            await cognitoClient.send(new AdminCreateUserCommand({
               UserPoolId: USER_POOL_ID,
               Username: normalizedPhone,
               UserAttributes: [
                  { Name: 'phone_number', Value: normalizedPhone },
                  { Name: 'phone_number_verified', Value: 'true' },
                  { Name: 'custom:role', Value: role },
                  { Name: 'custom:tenant_id', Value: tenantId },
               ],
               MessageAction: 'SUPPRESS', // We'll handle OTP ourselves
            }));
            logger.info('requestOTP', 'User created in Cognito', { phone: normalizedPhone, role });
         } catch (createError: any) {
            logger.error('requestOTP', 'Failed to create user in Cognito', createError, { phone: normalizedPhone });
            throw createError;
         }

         // Auto-confirm user by setting a permanent password
         const tempPassword = `WebDPro${Math.random().toString(36).slice(-8)}!A1`;
         try {
            await cognitoClient.send(new AdminSetUserPasswordCommand({
               UserPoolId: USER_POOL_ID,
               Username: normalizedPhone,
               Password: tempPassword,
               Permanent: true,
            }));
            logger.info('requestOTP', 'User password set', { phone: normalizedPhone });
         } catch (passwordError: any) {
            logger.error('requestOTP', 'Failed to set user password', passwordError, { phone: normalizedPhone });
            throw passwordError;
         }
      }

      // Initiate custom auth flow (OTP)
      let authResponse;
      try {
         authResponse = await cognitoClient.send(new InitiateAuthCommand({
            AuthFlow: 'CUSTOM_AUTH',
            ClientId: CLIENT_ID,
            AuthParameters: {
               USERNAME: normalizedPhone,
            },
         }));
         logger.info('requestOTP', 'OTP auth flow initiated', { phone: normalizedPhone });
      } catch (authError: any) {
         logger.error('requestOTP', 'Failed to initiate auth flow', authError, { phone: normalizedPhone });
         throw authError;
      }

      return response(200, {
         success: true,
         message: 'OTP sent successfully',
         session: authResponse.Session,
         challenge: authResponse.ChallengeName,
      });
   } catch (error: any) {
      logger.error('requestOTP', 'OTP request failed', error);
      return response(500, { error: error.message || 'Failed to send OTP' });
   }
};

/**
 * POST /auth/otp/verify
 * Verify OTP and return tokens
 */
export const verifyOTP = async (event: APIGatewayEvent) => {
   try {
      const body = JSON.parse(event.body || '{}');
      const { phone, otp, session } = body;

      if (!phone || !otp || !session) {
         logger.warn('verifyOTP', 'Missing required fields', { hasPhone: !!phone, hasOtp: !!otp, hasSession: !!session });
         return response(400, { error: 'Phone, OTP, and session are required' });
      }

      const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      logger.info('verifyOTP', 'Verifying OTP', { phone: normalizedPhone });

      // Verify OTP
      let authResponse;
      try {
         authResponse = await cognitoClient.send(new RespondToAuthChallengeCommand({
            ClientId: CLIENT_ID,
            ChallengeName: 'CUSTOM_CHALLENGE',
            Session: session,
            ChallengeResponses: {
               USERNAME: normalizedPhone,
               ANSWER: otp,
            },
         }));
      } catch (authError: any) {
         logger.error('verifyOTP', 'Cognito auth challenge failed', authError, { phone: normalizedPhone });
         return response(401, { error: 'Invalid OTP' });
      }

      if (!authResponse.AuthenticationResult) {
         logger.warn('verifyOTP', 'Invalid OTP provided', { phone: normalizedPhone });
         return response(401, { error: 'Invalid OTP' });
      }

      logger.info('verifyOTP', 'OTP verified successfully', { phone: normalizedPhone });

      // Get or create user profile
      let user;
      try {
         user = await getUserProfile(normalizedPhone);
         if (!user) {
            user = await createUserProfile(normalizedPhone, body.role || 'CUSTOMER');
            logger.info('verifyOTP', 'User profile created', { phone: normalizedPhone });
         } else {
            logger.info('verifyOTP', 'User profile retrieved', { phone: normalizedPhone });
         }
      } catch (dbError: any) {
         logger.error('verifyOTP', 'Failed to get/create user profile', dbError, { phone: normalizedPhone });
         return response(500, { error: 'Failed to retrieve user profile' });
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
            tenant_id: user.tenant_id,
         },
      });
   } catch (error: any) {
      logger.error('verifyOTP', 'OTP verification failed', error);
      return response(401, { error: 'Invalid or expired OTP' });
   }
};

/**
 * POST /auth/refresh
 * Refresh access token
 */
export const refreshToken = async (event: APIGatewayEvent) => {
   try {
      const body = JSON.parse(event.body || '{}');
      const { refreshToken } = body;

      if (!refreshToken) {
         return response(400, { error: 'Refresh token is required' });
      }

      const authResponse = await cognitoClient.send(new InitiateAuthCommand({
         AuthFlow: 'REFRESH_TOKEN_AUTH',
         ClientId: CLIENT_ID,
         AuthParameters: {
            REFRESH_TOKEN: refreshToken,
         },
      }));

      return response(200, {
         success: true,
         tokens: {
            accessToken: authResponse.AuthenticationResult?.AccessToken,
            idToken: authResponse.AuthenticationResult?.IdToken,
            expiresIn: authResponse.AuthenticationResult?.ExpiresIn,
         },
      });
   } catch (error: any) {
      console.error('Error refreshing token:', error);
      return response(401, { error: 'Invalid refresh token' });
   }
};

/**
 * GET /auth/profile
 * Get user profile from token
 */
export const getProfile = async (event: APIGatewayEvent) => {
   try {
      // Extract user info from authorizer context
      const claims = (event as any).requestContext?.authorizer?.claims;
      if (!claims) {
         logger.warn('getProfile', 'Missing authorizer claims - unauthorized access');
         return response(401, { error: 'Unauthorized - missing authentication' });
      }

      const phone = claims.phone_number || claims['cognito:username'];
      if (!phone) {
         logger.warn('getProfile', 'Missing phone number in claims', { claims: Object.keys(claims) });
         return response(401, { error: 'Unauthorized - invalid token claims' });
      }

      logger.info('getProfile', 'Fetching user profile', { phone });

      let user;
      try {
         user = await getUserProfile(phone);
      } catch (dbError: any) {
         logger.error('getProfile', 'DynamoDB lookup failed', dbError, {
            phone,
            tableName: USERS_TABLE,
         });
         return response(500, { error: 'Failed to retrieve user profile' });
      }

      if (!user) {
         logger.warn('getProfile', 'User profile not found', { phone });
         return response(404, { error: 'User profile not found' });
      }

      logger.info('getProfile', 'User profile retrieved successfully', { phone, userId: user.user_id });

      return response(200, {
         success: true,
         user,
      });
   } catch (error: any) {
      logger.error('getProfile', 'Failed to get profile', error);
      return response(500, { error: 'Failed to get profile' });
   }
};

/**
 * POST /auth/google/sync
 * Sync Google OAuth user to DynamoDB
 */
export const syncGoogleUser = async (event: APIGatewayEvent) => {
   try {
      const authHeader = event.headers.Authorization || event.headers.authorization;
      if (!authHeader) {
         console.error('[syncGoogleUser] Missing authorization header');
         return response(401, { error: 'No authorization token provided' });
      }

      const token = authHeader.replace('Bearer ', '');
      console.log('[syncGoogleUser] Processing request with token');

      // Get user info from Cognito using the access token
      let userInfo;
      try {
         userInfo = await cognitoClient.send(new GetUserCommand({
            AccessToken: token,
         }));
         console.log('[syncGoogleUser] Successfully retrieved user from Cognito');
      } catch (cognitoError: any) {
         console.error('[syncGoogleUser] Cognito GetUserCommand failed:', JSON.stringify({
            errorName: cognitoError.name,
            errorMessage: cognitoError.message,
            errorCode: cognitoError.$metadata?.httpStatusCode,
         }));

         if (cognitoError.name === 'NotAuthorizedException') {
            return response(401, { error: 'Invalid or expired access token' });
         }

         return response(500, {
            error: 'Failed to retrieve user from Cognito',
            details: cognitoError.message
         });
      }

      const email = userInfo.UserAttributes?.find(attr => attr.Name === 'email')?.Value;
      const name = userInfo.UserAttributes?.find(attr => attr.Name === 'name')?.Value;
      const sub = userInfo.UserAttributes?.find(attr => attr.Name === 'sub')?.Value;

      if (!email || !sub) {
         console.error('[syncGoogleUser] Missing required user attributes:', JSON.stringify({ email, sub }));
         return response(400, { error: 'Invalid user data from Google' });
      }

      console.log('[syncGoogleUser] User attributes extracted:', JSON.stringify({ email, name, sub }));

      // Check if user already exists by email
      let user;
      try {
         user = await getUserProfileByEmail(email);
         console.log('[syncGoogleUser] User lookup result:', JSON.stringify({ found: !!user }));
      } catch (dbError: any) {
         console.error('[syncGoogleUser] DynamoDB lookup failed:', JSON.stringify({
            errorName: dbError.name,
            errorMessage: dbError.message,
            tableName: USERS_TABLE,
         }));
         return response(500, {
            error: 'Failed to lookup user profile',
            details: dbError.message
         });
      }

      if (!user) {
         // Create new user profile
         try {
            user = await createUserProfile(email, 'BUSINESS_OWNER', name, sub);
            console.log('[syncGoogleUser] Created new user profile:', JSON.stringify({ userId: user.user_id }));
         } catch (createError: any) {
            console.error('[syncGoogleUser] Failed to create user profile:', JSON.stringify({
               errorName: createError.name,
               errorMessage: createError.message,
               tableName: USERS_TABLE,
            }));
            return response(500, {
               error: 'Failed to create user profile',
               details: createError.message
            });
         }
      }

      return response(200, {
         success: true,
         user: {
            id: user.user_id,
            phone: user.phone,
            email: user.email,
            role: user.role,
            name: user.name,
            tenant_id: user.tenant_id,
         },
      });
   } catch (error: any) {
      console.error('[syncGoogleUser] Unexpected error:', JSON.stringify({
         errorName: error.name,
         errorMessage: error.message,
         errorStack: error.stack,
      }));
      return response(500, { error: 'Failed to sync user profile' });
   }
};

// Helper: Get user profile from DynamoDB by phone
async function getUserProfile(phone: string) {
   try {
      const result = await docClient.send(new GetCommand({
         TableName: USERS_TABLE,
         Key: { phone },
      }));
      return result.Item;
   } catch {
      return null;
   }
}

// Helper: Get user profile from DynamoDB by email (scan operation)
async function getUserProfileByEmail(email: string) {
   try {
      // In production, you should use a GSI on email for better performance
      const result = await docClient.send(new GetCommand({
         TableName: USERS_TABLE,
         Key: { phone: email }, // Using email as phone for Google users
      }));
      return result.Item;
   } catch {
      return null;
   }
}

// Helper: Create user profile in DynamoDB
async function createUserProfile(identifier: string, role: string, name?: string, cognitoSub?: string) {
   const user = {
      user_id: cognitoSub || `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      phone: identifier,
      email: identifier.includes('@') ? identifier : null,
      role,
      name: name || null,
      tenant_id: role === 'BUSINESS_OWNER' ? `tenant_${Date.now()}` : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
   };

   await docClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
   }));

   return user;
}
