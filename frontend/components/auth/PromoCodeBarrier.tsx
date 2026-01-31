"use client";

import { useState } from "react";
import { Lock, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

// DEV-ONLY: Temporary access gate. Remove when project is public.
// This component restricts dashboard access until a valid promo code is entered.

interface PromoCodeBarrierProps {
   onSuccess: () => void;
}

export default function PromoCodeBarrier({ onSuccess }: PromoCodeBarrierProps) {
   const [code, setCode] = useState("");
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      // Simulate a small delay for better UX
      setTimeout(() => {
         if (code === "dprks99") {
            localStorage.setItem("promo_verified", "true");
            onSuccess();
         } else {
            setError("Invalid promo code");
            setLoading(false);
         }
      }, 600);
   };

   return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
         <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-gray-100">

            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-center text-white">
               <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Lock className="w-8 h-8 text-white" />
               </div>
               <h2 className="text-2xl font-bold mb-1">Early Access</h2>
               <p className="text-indigo-100 text-sm">Enter your promo code to continue</p>
            </div>

            {/* Form Section */}
            <div className="p-8">
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                     <label
                        htmlFor="promo-code"
                        className="block text-sm font-medium text-gray-700 mb-1"
                     >
                        Access Code
                     </label>
                     <div className="relative">
                        <input
                           id="promo-code"
                           type="password"
                           value={code}
                           onChange={(e) => {
                              setCode(e.target.value);
                              if (error) setError("");
                           }}
                           className={`
                    w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 transition-all outline-none
                    ${error
                                 ? "border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30"
                                 : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100"
                              }
                  `}
                           placeholder="Enter code"
                           autoFocus
                        />
                     </div>
                     {error && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                           <AlertCircle className="w-4 h-4" />
                           <span>{error}</span>
                        </div>
                     )}
                  </div>

                  <button
                     type="submit"
                     disabled={loading || !code.trim()}
                     className={`
                w-full py-3 px-4 rounded-lg font-medium text-white shadow-lg transition-all
                items-center justify-center flex gap-2
                ${loading || !code.trim()
                           ? "bg-gray-400 cursor-not-allowed"
                           : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0"
                        }
              `}
                  >
                     {loading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                        <>
                           Unlock Dashboard
                           <ArrowRight className="w-4 h-4" />
                        </>
                     )}
                  </button>
               </form>

               <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <div className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-full">
                     <Sparkles className="w-3 h-3" />
                     <span>Limited Preview</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
