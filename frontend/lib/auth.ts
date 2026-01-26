
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface AuthResult {
   success: boolean;
   message?: string;
   session?: string;
   tokens?: {
      accessToken: string;
      idToken: string;
      refreshToken: string;
   };
}

export async function sendOtp(phone: string): Promise<AuthResult> {
   try {
      const res = await fetch(`${API_URL}/auth/otp/request`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      return {
         success: true,
         session: data.session,
         message: data.message
      };
   } catch (error: any) {
      return { success: false, message: error.message };
   }
}

export async function verifyOtp(phone: string, otp: string, session: string): Promise<AuthResult> {
   try {
      const res = await fetch(`${API_URL}/auth/otp/verify`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ phone, otp, session }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to verify OTP");

      return {
         success: true,
         tokens: data.tokens,
         message: "Login successful"
      };
   } catch (error: any) {
      return { success: false, message: error.message };
   }
}

export async function registerUser(phone: string, name: string): Promise<AuthResult> {
   // Registration is handled automatically by the backend requestOTP flow
   // But if we need a specific register call, we can add it.
   // For now, we'll reuse sendOtp as it handles user creation if missing.
   return sendOtp(phone);
}
