"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeCodeForTokens } from "@/lib/auth";
import { Loader2 } from "lucide-react";

function AuthCallbackInner() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      const handleCallback = async () => {
         const code = searchParams.get("code");
         const errorParam = searchParams.get("error");

         if (errorParam) {
            setError(`Authentication failed: ${errorParam}`);
            setTimeout(() => router.push("/login"), 3000);
            return;
         }

         if (!code) {
            setError("No authorization code received");
            setTimeout(() => router.push("/login"), 3000);
            return;
         }

         try {
            const result = await exchangeCodeForTokens(code);

            if (result.success && result.tokens && result.user) {
               localStorage.setItem("token", result.tokens.idToken);
               localStorage.setItem("refresh_token", result.tokens.refreshToken);
               localStorage.setItem("user", JSON.stringify(result.user));

               // Check for pending prompt
               const pendingPrompt = localStorage.getItem("pending_prompt");
               const promoVerified = localStorage.getItem("promo_verified");

               if (pendingPrompt) {
                  localStorage.removeItem("pending_prompt");
                  const encodedPrompt = encodeURIComponent(pendingPrompt);
                  router.push(`/dashboard/sites/new?prompt=${encodedPrompt}`);
               } else if (promoVerified === "true") {
                  // Promo already verified, go to dashboard
                  router.push("/dashboard/sites");
               } else {
                  // Need promo verification first
                  router.push("/auth/promo");
               }
            } else {
               setError(result.message || "Authentication failed");
               setTimeout(() => router.push("/login"), 3000);
            }
         } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An error occurred during authentication");
            setTimeout(() => router.push("/login"), 3000);
         }
      };

      handleCallback();
   }, [searchParams, router]);

   return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
         <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center">
               {error ? (
                  <>
                     <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                     </div>
                     <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
                     <p className="text-gray-600">{error}</p>
                     <p className="text-sm text-gray-500 mt-4">Redirecting to login...</p>
                  </>
               ) : (
                  <>
                     <Loader2 className="mx-auto w-16 h-16 text-indigo-600 animate-spin mb-4" />
                     <h1 className="text-2xl font-bold text-gray-900 mb-2">Completing Sign In</h1>
                     <p className="text-gray-600">Please wait while we authenticate you...</p>
                  </>
               )}
            </div>
         </div>
      </div>
   );
}

function CallbackFallback() {
   return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
         <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
            <Loader2 className="mx-auto w-16 h-16 text-indigo-600 animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
            <p className="text-gray-600">Please wait...</p>
         </div>
      </div>
   );
}

export default function AuthCallback() {
   return (
      <Suspense fallback={<CallbackFallback />}>
         <AuthCallbackInner />
      </Suspense>
   );
}
