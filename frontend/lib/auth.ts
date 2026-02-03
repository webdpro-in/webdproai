
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

export interface AuthTokens {
   accessToken: string;
   idToken: string;
   refreshToken: string;
   expiresAt: number;
}

// Storage keys
const STORAGE_KEYS = {
   TOKEN: 'token',
   ID_TOKEN: 'idToken',
   REFRESH_TOKEN: 'refreshToken',
   ACCESS_TOKEN: 'accessToken',
   USER: 'user',
   EXPIRES_AT: 'expiresAt',
   PROMO_VERIFIED: 'promo_verified',
} as const;

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

export async function registerUser(phone: string): Promise<AuthResult> {
   // Registration is handled automatically by the backend requestOTP flow
   return sendOtp(phone);
}

// Google OAuth Functions
export function getGoogleOAuthUrl(): string {
   // CORRECT Cognito domain - has Google OAuth configured
   const COGNITO_DOMAIN = 'webdpro-auth-prod-2026.auth.eu-north-1.amazoncognito.com';
   const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

   if (!clientId) {
      throw new Error('NEXT_PUBLIC_COGNITO_CLIENT_ID is not configured');
   }

   // Dynamic redirect URI based on current window location
   const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL!;
   const redirectUri = `${origin}/auth/callback`;
   console.log("Generating Auth URL with redirect_uri:", redirectUri);

   const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'email openid profile',
      redirect_uri: redirectUri,
      identity_provider: 'Google'
   });

   return `https://${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<AuthResult> {
   try {
      // CORRECT Cognito domain - has Google OAuth configured
      const COGNITO_DOMAIN = 'webdpro-auth-prod-2026.auth.eu-north-1.amazoncognito.com';
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
      const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;
      const redirectUri = `${origin}/auth/callback`;

      const tokenEndpoint = `https://${COGNITO_DOMAIN}/oauth2/token`;

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

      // Calculate token expiration (default 1 hour)
      const expiresIn = tokens.expires_in || 3600;
      const expiresAt = Date.now() + (expiresIn * 1000);

      // Store tokens
      storeTokens({
         accessToken: tokens.access_token,
         idToken: tokens.id_token,
         refreshToken: tokens.refresh_token,
         expiresAt,
      });

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

      // Store user data
      storeUser(user);

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


// Complete session cleanup - clears all auth data
export function clearSession(): void {
   if (typeof window === 'undefined') return;

   // Clear all localStorage keys
   Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
   });

   // Clear sessionStorage
   sessionStorage.clear();

   // Clear any auth-related cookies
   document.cookie.split(";").forEach((c) => {
      document.cookie = c
         .replace(/^ +/, "")
         .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
}

// Store authentication tokens securely
export function storeTokens(tokens: AuthTokens): void {
   if (typeof window === 'undefined') return;

   localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
   localStorage.setItem(STORAGE_KEYS.ID_TOKEN, tokens.idToken);
   localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
   localStorage.setItem(STORAGE_KEYS.TOKEN, tokens.idToken); // Update to use ID Token for consistency
   localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, tokens.expiresAt.toString());

   // Set cookie for middleware access
   // using idToken as it contains identity information
   document.cookie = `token=${tokens.idToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

// Get stored tokens
export function getTokens(): AuthTokens | null {
   if (typeof window === 'undefined') return null;

   const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
   const idToken = localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
   const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
   const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

   if (!accessToken || !idToken || !refreshToken || !expiresAt) {
      return null;
   }

   return {
      accessToken,
      idToken,
      refreshToken,
      expiresAt: parseInt(expiresAt, 10),
   };
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
   const tokens = getTokens();
   if (!tokens) return false;

   // Check if token is expired
   return Date.now() < tokens.expiresAt;
}

// Check if token is expired
export function isTokenExpired(): boolean {
   const tokens = getTokens();
   if (!tokens) return true;

   return Date.now() >= tokens.expiresAt;
}

// Store user data
export function storeUser(user: AuthResult['user']): void {
   if (typeof window === 'undefined' || !user) return;
   localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

// Get stored user
export function getUser(): AuthResult['user'] | null {
   if (typeof window === 'undefined') return null;

   const userStr = localStorage.getItem(STORAGE_KEYS.USER);
   if (!userStr) return null;

   try {
      return JSON.parse(userStr);
   } catch {
      return null;
   }
}

// Logout - complete cleanup and redirect
export function logout(): void {
   clearSession();

   // Dispatch logout event for UI updates
   if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('logout'));
      window.location.href = '/login';
   }
}
