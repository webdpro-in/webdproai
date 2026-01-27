
import { apiAuth } from './api';

export interface AuthResult {
   success: boolean;
   message?: string;
   session?: string;
   tokens?: {
      accessToken: string;
      idToken: string;
      refreshToken: string;
   };
   user?: {
      id: string;
      phone: string;
      role: string;
      name: string;
      tenant_id?: string;
   };
}

export async function sendOtp(phone: string): Promise<AuthResult> {
   try {
      const result = await apiAuth.requestOTP(phone);
      return {
         success: true,
         session: result.session,
         message: result.message
      };
   } catch (error: any) {
      return { success: false, message: error.message };
   }
}

export async function verifyOtp(phone: string, otp: string, session: string): Promise<AuthResult> {
   try {
      const result = await apiAuth.verifyOTP(phone, otp, session);
      return {
         success: true,
         tokens: result.tokens,
         user: result.user,
         message: "Login successful"
      };
   } catch (error: any) {
      return { success: false, message: error.message };
   }
}

export async function registerUser(phone: string, name: string): Promise<AuthResult> {
   // Registration is handled automatically by the backend requestOTP flow
   return sendOtp(phone);
}

// Google OAuth Functions
export function getGoogleOAuthUrl(): string {
   const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
   const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
   const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;
   const region = process.env.NEXT_PUBLIC_COGNITO_REGION || 'eu-north-1';

   const params = new URLSearchParams({
      client_id: clientId!,
      response_type: 'code',
      scope: 'email openid profile',
      redirect_uri: redirectUri,
      identity_provider: 'Google'
   });

   return `https://${cognitoDomain}.auth.${region}.amazoncognito.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<AuthResult> {
   try {
      const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
      // Use window.location.origin to ensure match with login page
      const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;
      const redirectUri = `${origin}/auth/callback`;
      const region = process.env.NEXT_PUBLIC_COGNITO_REGION || 'eu-north-1';

      const tokenEndpoint = `https://${cognitoDomain}.auth.${region}.amazoncognito.com/oauth2/token`;

      const params = new URLSearchParams({
         grant_type: 'authorization_code',
         client_id: clientId!,
         code: code,
         redirect_uri: redirectUri
      });

      console.log("Exchanging code for tokens:", { tokenEndpoint, clientId, redirectUri });

      const response = await fetch(tokenEndpoint, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
         },
         body: params.toString()
      });

      if (!response.ok) {
         const errorText = await response.text();
         console.error("Token exchange failed:", response.status, errorText);
         throw new Error(`Failed to exchange code for tokens: ${errorText}`);
      }

      const tokens = await response.json();
      console.log("Tokens received, decoding ID token...");

      // Decode ID token to get user info
      const idTokenPayload = JSON.parse(atob(tokens.id_token.split('.')[1]));
      console.log("ID Token Payload:", idTokenPayload);

      // Sync user with backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      console.log("Syncing with backend:", `${apiUrl}/auth/google/sync`);

      let user;
      try {
         const syncResponse = await fetch(`${apiUrl}/auth/google/sync`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${tokens.access_token}`
            }
         });

         if (syncResponse.ok) {
            const syncData = await syncResponse.json();
            user = syncData.user;
            console.log("Backend sync successful:", user);
         } else {
            throw new Error(`Sync failed with status: ${syncResponse.status}`);
         }
      } catch (syncError) {
         console.warn("Backend sync failed (likely CORS), proceeding with local fallback:", syncError);
         // Fallback to token data if sync fails
         user = {
            id: idTokenPayload.sub,
            phone: idTokenPayload.phone_number || idTokenPayload.email,
            role: idTokenPayload['custom:role'] || 'BUSINESS_OWNER',
            name: idTokenPayload.name || idTokenPayload.email,
            tenant_id: idTokenPayload['custom:tenant_id'] || `tenant_${Date.now()}`
         };
      }

      return {
         success: true,
         tokens: {
            accessToken: tokens.access_token,
            idToken: tokens.id_token,
            refreshToken: tokens.refresh_token
         },
         user,
         message: 'Login successful'
      };
   } catch (error: any) {
      console.error("Auth Error:", error);
      return { success: false, message: error.message };
   }
}
