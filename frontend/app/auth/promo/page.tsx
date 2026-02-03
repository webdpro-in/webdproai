"use client";

import { useRouter } from "next/navigation";
import PromoCodeBarrier from "@/components/auth/PromoCodeBarrier";
import { useEffect, useState } from "react";

export default function PromoPage() {
   const router = useRouter();
   const [isChecking, setIsChecking] = useState(true);

   useEffect(() => {
      // Check if user is authenticated
      const token = localStorage.getItem("token");
      if (!token) {
         // Not authenticated, redirect to login
         router.push("/login");
         return;
      }

      // Check if promo already verified
      const promoVerified = localStorage.getItem("promo_verified");
      if (promoVerified === "true") {
         // Already verified, redirect to dashboard
         router.push("/dashboard/sites");
         return;
      }

      setIsChecking(false);
   }, [router]);

   const handlePromoSuccess = () => {
      router.push("/dashboard/sites");
   };

   if (isChecking) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
               <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-gray-600">Loading...</p>
            </div>
         </div>
      );
   }

   return <PromoCodeBarrier onSuccess={handlePromoSuccess} />;
}
