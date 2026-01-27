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
         return response(400, { error: 'Phone number is required' });
      }

      // Normalize phone number (add +91 if not present)
      const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      // Check if user exists, if not create
      let userExists = false;
      try {
         await cognitoClient.send(new AdminGetUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: normalizedPhone,
         }));
         userExists = true;
      } catch (err: any) {
         if (err.name !== 'UserNotFoundException') {
            throw err;
         }
      }

      if (!userExists) {
         // Generate tenant_id for business owners
         const tenantId = role === 'BUSINESS_OWNER' ? `tenant_${Date.now()}` : '';

         // Create new user (Cognito will send OTP)
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

         // Auto-confirm user by setting a permanent password
         const tempPassword = `WebDPro${Math.random().toString(36).slice(-8)}!A1`;
         await cognitoClient.send(new AdminSetUserPasswordCommand({
            UserPoolId: USER_POOL_ID,
            Username: normalizedPhone,
            Password: tempPassword,
            Permanent: true,
         }));
      }

      // Initiate custom auth flow (OTP)
      const authResponse = await cognitoClient.send(new InitiateAuthCommand({
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
   } catch (error: any) {
      console.error('Error requesting OTP:', error);
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
         return response(400, { error: 'Phone, OTP, and session are required' });
      }

      const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      // Verify OTP
      const authResponse = await cognitoClient.send(new RespondToAuthChallengeCommand({
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
      let user = await getUserProfile(normalizedPhone);
      if (!user) {
         user = await createUserProfile(normalizedPhone, body.role || 'CUSTOMER');
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
      console.error('Error verifying OTP:', error);
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
         return response(401, { error: 'Unauthorized' });
      }

      const phone = claims.phone_number || claims['cognito:username'];
      const user = await getUserProfile(phone);

      if (!user) {
         return response(404, { error: 'User profile not found' });
      }

      return response(200, {
         success: true,
         user,
      });
   } catch (error: any) {
      console.error('Error getting profile:', error);
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
         return response(401, { error: 'No authorization token provided' });
      }

      const token = authHeader.replace('Bearer ', '');

      // Get user info from Cognito using the access token
      const userInfo = await cognitoClient.send(new GetUserCommand({
         AccessToken: token,
      }));

      const email = userInfo.UserAttributes?.find(attr => attr.Name === 'email')?.Value;
      const name = userInfo.UserAttributes?.find(attr => attr.Name === 'name')?.Value;
      const sub = userInfo.UserAttributes?.find(attr => attr.Name === 'sub')?.Value;

      if (!email || !sub) {
         return response(400, { error: 'Invalid user data from Google' });
      }

      // Check if user already exists by email
      let user = await getUserProfileByEmail(email);

      if (!user) {
         // Create new user profile
         user = await createUserProfile(email, 'BUSINESS_OWNER', name, sub);
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
      console.error('Error syncing Google user:', error);
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
