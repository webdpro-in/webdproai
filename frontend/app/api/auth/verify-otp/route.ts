import { NextRequest, NextResponse } from "next/server";
import { OTPService } from "@/lib/auth/otp-service";
import { SessionService } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
   try {
      const { contact, otp } = await request.json();

      // Validate input
      if (!contact || !otp) {
         return NextResponse.json(
            { success: false, message: "Contact and OTP are required" },
            { status: 400 }
         );
      }

      // Verify OTP
      const verifyResult = await OTPService.verifyOTP(contact, otp);

      if (!verifyResult.success) {
         return NextResponse.json(verifyResult, { status: 400 });
      }

      // Get or create user
      const user = await SessionService.getOrCreateUser(contact);

      if (!user) {
         return NextResponse.json(
            { success: false, message: "Failed to create user session" },
            { status: 500 }
         );
      }

      // Create JWT token
      const token = SessionService.createToken(user);

      return NextResponse.json({
         success: true,
         message: "Login successful",
         token,
         user,
      });
   } catch (error) {
      console.error("Verify OTP error:", error);
      return NextResponse.json(
         { success: false, message: "Internal server error" },
         { status: 500 }
      );
   }
}
