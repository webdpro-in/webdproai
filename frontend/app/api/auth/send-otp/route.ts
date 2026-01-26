import { NextRequest, NextResponse } from "next/server";
import { OTPService } from "@/lib/auth/otp-service";
import { isValidEmail, isValidMobile } from "@/lib/utils";

export async function POST(request: NextRequest) {
   try {
      const { contact } = await request.json();

      // Validate input
      if (!contact) {
         return NextResponse.json(
            { success: false, message: "Contact is required" },
            { status: 400 }
         );
      }

      if (!isValidEmail(contact) && !isValidMobile(contact)) {
         return NextResponse.json(
            { success: false, message: "Invalid email or mobile number" },
            { status: 400 }
         );
      }

      // Send OTP
      const result = await OTPService.sendOTP(contact);

      return NextResponse.json(result);
   } catch (error) {
      console.error("Send OTP error:", error);
      return NextResponse.json(
         { success: false, message: "Internal server error" },
         { status: 500 }
      );
   }
}
