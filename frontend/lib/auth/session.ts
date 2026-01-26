import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRY = "7d"; // 7 days

export interface SessionUser {
   id: string;
   email?: string;
   mobile?: string;
   role: string;
   tenantId?: string;
   name?: string;
}

export interface SessionToken {
   user: SessionUser;
   iat: number;
   exp: number;
}

/**
 * Session Management - Simulates AWS Cognito session handling
 */
export class SessionService {
   /**
    * Create JWT token for authenticated user
    */
   static createToken(user: SessionUser): string {
      return jwt.sign({ user }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
   }

   /**
    * Verify and decode JWT token
    */
   static verifyToken(token: string): SessionToken | null {
      try {
         return jwt.verify(token, JWT_SECRET) as SessionToken;
      } catch (error) {
         return null;
      }
   }

   /**
    * Get or create user from contact (email/mobile)
    */
   static async getOrCreateUser(contact: string, role: string = "CUSTOMER"): Promise<SessionUser | null> {
      try {
         const isEmail = contact.includes("@");

         // Find existing user
         let user = await prisma.user.findFirst({
            where: isEmail ? { email: contact } : { mobile: contact },
            include: {
               tenant: true,
            },
         });

         // Create new user if doesn't exist
         if (!user) {
            user = await prisma.user.create({
               data: isEmail ? { email: contact, role } : { mobile: contact, role },
               include: {
                  tenant: true,
               },
            });
         }

         return {
            id: user.id,
            email: user.email || undefined,
            mobile: user.mobile || undefined,
            role: user.role,
            tenantId: user.tenantId || undefined,
            name: user.name || undefined,
         };
      } catch (error) {
         console.error("Error getting/creating user:", error);
         return null;
      }
   }

   /**
    * Check if user has required role
    */
   static hasRole(user: SessionUser, allowedRoles: string[]): boolean {
      return allowedRoles.includes(user.role);
   }

   /**
    * Check if user belongs to tenant
    */
   static belongsToTenant(user: SessionUser, tenantId: string): boolean {
      return user.tenantId === tenantId || user.role === "SUPER_ADMIN";
   }
}
