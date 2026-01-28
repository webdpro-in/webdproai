"use client"

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Loader2, Mail, Smartphone, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getGoogleOAuthUrl } from "@/lib/auth";

// Placeholder for Auth SDK (we will implement/mock this logic)
const signIn = async (identifier: string) => {
   // THIS IS MOCK LOGIC. In reality, call the backend /auth/initiate or custom auth
   console.log("Initiating auth for:", identifier);
   return new Promise(resolve => setTimeout(resolve, 1000));
}

const verifyOtp = async (identifier: string, otp: string) => {
   console.log("Verifying OTP:", otp);
   return new Promise(resolve => setTimeout(resolve, 1000));
}

export default function LoginPage() {
   const [step, setStep] = useState<"INPUT" | "OTP" | "PROFILE">("INPUT");
   const [identifier, setIdentifier] = useState("");
   const [otp, setOtp] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [isEmail, setIsEmail] = useState(false);
   const router = useRouter();

   const handleInitAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      // Simple detection (regex)
      const isEmailInput = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const isPhoneInput = /^\+?[0-9]{10,13}$/.test(identifier);

      if (!isEmailInput && !isPhoneInput) {
         alert("Please enter a valid Email or Mobile Number");
         setIsLoading(false);
         return;
      }

      setIsEmail(isEmailInput);

      // Call AWS Cognito (Custom Auth)
      await signIn(identifier);

      setIsLoading(false);
      setStep("OTP");
   };

   const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      await verifyOtp(identifier, otp);

      setIsLoading(false);

      // MOCK: Check if profile is complete
      const isProfileComplete = true; // Assume true for now

      if (isProfileComplete) {
         router.push("/dashboard");
      } else {
         setStep("PROFILE");
      }
   };

   return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
         <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8 space-y-8">
            <div className="text-center space-y-2">
               <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto shadow-lg shadow-indigo-200">W</div>
               <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
               <p className="text-gray-500 text-sm">Login or create an account to manage your business.</p>
            </div>

            {step === "INPUT" && (
               <div className="space-y-6 animate-fade-in">
                  {/* Google Login Button */}
                  <button
                     onClick={() => {
                        const cognitoUrl = getGoogleOAuthUrl();
                        console.log("Redirecting to Cognito:", cognitoUrl);
                        window.location.href = cognitoUrl;
                     }}
                     className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl py-4 transition-all shadow-sm group"
                  >
                     <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                           fill="currentColor"
                           d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                           className="fill-blue-500"
                        />
                        <path
                           fill="currentColor"
                           d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                           className="fill-green-500"
                        />
                        <path
                           fill="currentColor"
                           d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                           className="fill-yellow-500"
                        />
                        <path
                           fill="currentColor"
                           d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                           className="fill-red-500"
                        />
                     </svg>
                     <span className="group-hover:text-gray-900">Continue with Google</span>
                  </button>

                  <div className="relative">
                     <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                     <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Or continue with</span></div>
                  </div>

                  <form onSubmit={handleInitAuth} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 ml-1">Email or Mobile Number</label>
                        <input
                           type="text"
                           value={identifier}
                           onChange={(e) => setIdentifier(e.target.value)}
                           placeholder="e.g. name@company.com or +9190000..."
                           className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                           autoFocus
                        />
                     </div>
                     <Button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 text-lg shadow-lg shadow-indigo-200"
                        disabled={!identifier || isLoading}
                     >
                        {isLoading ? <Loader2 className="animate-spin" /> : "Continue"}
                     </Button>
                  </form>
               </div>
            )}

            {step === "OTP" && (
               <form onSubmit={handleVerifyOtp} className="space-y-6 animate-slide-up">
                  <div className="space-y-2 text-center">
                     <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mb-2">
                        {isEmail ? <Mail className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                     </div>
                     <p className="text-gray-600">Enter the code sent to <br /><span className="font-semibold text-gray-900">{identifier}</span></p>
                  </div>

                  <div className="flex justify-center gap-2">
                     <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="w-full text-center tracking-[1em] font-mono text-2xl px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        autoFocus
                     />
                  </div>

                  <Button
                     type="submit"
                     className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 text-lg shadow-lg shadow-indigo-200"
                     disabled={otp.length !== 6 || isLoading}
                  >
                     {isLoading ? <Loader2 className="animate-spin" /> : "Verify & Login"}
                  </Button>

                  <button type="button" onClick={() => setStep("INPUT")} className="w-full text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                     Change ID
                  </button>
               </form>
            )}

            <p className="text-center text-xs text-gray-400">
               By continuing, you verify that you are the owner of this contact method.
            </p>
         </div>
      </div>
   )
}
