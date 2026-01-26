import {
   CognitoIdentityProviderClient,
   InitiateAuthCommand,
   RespondToAuthChallengeCommand,
   SignUpCommand
} from "@aws-sdk/client-cognito-identity-provider";

const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "eu-north-1";

const client = new CognitoIdentityProviderClient({ region: REGION });

export interface AuthResult {
   success: boolean;
   message?: string;
   session?: string; // For OTP challenge
   tokens?: {
      accessToken: string;
      idToken: string;
      refreshToken: string;
   };
}

// 1. Initiate Login (Send OTP)
export async function sendOtp(phoneNumber: string): Promise<AuthResult> {
   try {
      // Basic phone validation
      const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

      const command = new InitiateAuthCommand({
         AuthFlow: "CUSTOM_AUTH", // Or USER_SRP_AUTH if using password, but requirement is "Phone OTP"
         ClientId: CLIENT_ID,
         AuthParameters: {
            USERNAME: cleanPhone,
         },
      });

      const response = await client.send(command);

      return {
         success: true,
         session: response.Session,
         message: "OTP sent successfully"
      };

   } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
         // Auto-signup logic could go here, or we tell user to register
         return { success: false, message: "User not found. Please register first." };
      }
      console.error("Auth Error:", error);
      return { success: false, message: error.message || "Failed to send OTP" };
   }
}

// 2. Verify OTP
export async function verifyOtp(phoneNumber: string, answer: string, session: string): Promise<AuthResult> {
   try {
      const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

      const command = new RespondToAuthChallengeCommand({
         ChallengeName: "CUSTOM_CHALLENGE", // Checks if this matches the flow
         ClientId: CLIENT_ID,
         ChallengeResponses: {
            USERNAME: cleanPhone,
            ANSWER: answer,
         },
         Session: session,
      });

      const response = await client.send(command);

      if (response.AuthenticationResult) {
         return {
            success: true,
            tokens: {
               accessToken: response.AuthenticationResult.AccessToken!,
               idToken: response.AuthenticationResult.IdToken!,
               refreshToken: response.AuthenticationResult.RefreshToken!,
            }
         };
      }

      return { success: false, message: "Invalid OTP" };

   } catch (error: any) {
      console.error("Verify Error:", error);
      return { success: false, message: error.message || "Verification failed" };
   }
}

// 3. Register (If needed)
export async function registerUser(phoneNumber: string, name: string): Promise<AuthResult> {
   try {
      const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

      const command = new SignUpCommand({
         ClientId: CLIENT_ID,
         Username: cleanPhone,
         UserAttributes: [
            { Name: "phone_number", Value: cleanPhone },
            { Name: "name", Value: name }
         ]
      });

      await client.send(command);
      return { success: true, message: "User registered. Please log in." };

   } catch (error: any) {
      console.error("Register Error:", error);
      return { success: false, message: error.message };
   }
}
