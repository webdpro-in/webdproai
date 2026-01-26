import { prisma } from "@/lib/prisma";
import { generateOTP } from "@/lib/utils";

export interface OTPResult {
   success: boolean;
   message: string;
   expiresIn?: number;
}

/**
 * Mock OTP Service - Simulates AWS Cognito OTP functionality
 * In production, this would integrate with AWS Cognito
 */
export class OTPService {
   private static OTP_EXPIRY_MINUTES = 5;

   /**
    * Send OTP to email or mobile
    * In production: Would call AWS Cognito or SNS/SES
    */
   static async sendOTP(contact: string): Promise<OTPResult> {
      try {
         // Generate 6-digit OTP
         const code = generateOTP();
         const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

         // Delete any existing OTPs for this contact
         await prisma.oTP.deleteMany({
            where: { contact },
         });

         // Store OTP in database
         await prisma.oTP.create({
            data: {
               contact,
               code,
               expiresAt,
               verified: false,
            },
         });

         // In production: Send via AWS SNS (SMS) or SES (Email)
         console.log(`[MOCK OTP] Code for ${contact}: ${code}`);

         return {
            success: true,
            message: `OTP sent to ${contact}`,
            expiresIn: this.OTP_EXPIRY_MINUTES * 60,
         };
      } catch (error) {
         console.error("Error sending OTP:", error);
         return {
            success: false,
            message: "Failed to send OTP",
         };
      }
   }

   /**
    * Verify OTP code
    */
   static async verifyOTP(contact: string, code: string): Promise<OTPResult> {
      try {
         const otpRecord = await prisma.oTP.findFirst({
            where: {
               contact,
               code,
               verified: false,
            },
            orderBy: {
               createdAt: "desc",
            },
         });

         if (!otpRecord) {
            return {
               success: false,
               message: "Invalid OTP code",
            };
         }

         // Check if OTP is expired
         if (new Date() > otpRecord.expiresAt) {
            return {
               success: false,
               message: "OTP has expired",
            };
         }

         // Mark OTP as verified
         await prisma.oTP.update({
            where: { id: otpRecord.id },
            data: { verified: true },
         });

         return {
            success: true,
            message: "OTP verified successfully",
         };
      } catch (error) {
         console.error("Error verifying OTP:", error);
         return {
            success: false,
            message: "Failed to verify OTP",
         };
      }
   }

   /**
    * Clean up expired OTPs (should run periodically)
    */
   static async cleanupExpiredOTPs(): Promise<void> {
      await prisma.oTP.deleteMany({
         where: {
            expiresAt: {
               lt: new Date(),
            },
         },
      });
   }
}
