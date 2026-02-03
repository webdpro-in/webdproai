"use client";

import { useState } from "react";
import { sendOtp, verifyOtp, registerUser, getGoogleOAuthUrl } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginView() {
   const router = useRouter();
   const [step, setStep] = useState<"PHONE" | "OTP" | "REGISTER">("PHONE");
   const [phone, setPhone] = useState("");
   const [otp, setOtp] = useState("");
   const [name, setName] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
   const [session, setSession] = useState("");

   const handleGoogleLogin = () => {
      const googleOAuthUrl = getGoogleOAuthUrl();
      window.location.href = googleOAuthUrl;
   };

   const handleSendOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      // Simple validation
      if (phone.length < 10) {
         setError("Please enter a valid phone number");
         setLoading(false);
         return;
      }

      const res = await sendOtp(phone);
      setLoading(false);

      if (res.success && res.session) {
         setSession(res.session);
         setStep("OTP");
      } else if (res.message?.includes("User not found")) {
         setStep("REGISTER");
      } else {
         setError(res.message || "Failed to send OTP");
      }
   };

   const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      const res = await verifyOtp(phone, otp, session);
      setLoading(false);

      if (res.success && res.tokens && res.user) {
         // Store tokens
         localStorage.setItem("token", res.tokens.idToken);
         localStorage.setItem("refresh_token", res.tokens.refreshToken);
         localStorage.setItem("user", JSON.stringify(res.user));
         
         // Redirect based on user role
         if (res.user.role === "BUSINESS_OWNER") {
            router.push("/dashboard/sites");
         } else {
            router.push("/dashboard/sites");
         }
      } else {
         setError(res.message || "Invalid OTP");
      }
   };

   const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      const res = await registerUser(phone);
      setLoading(false);

      if (res.success) {
         setStep("PHONE");
         setError("Registration successful! Please login.");
      } else {
         setError(res.message || "Registration failed");
      }
   };

   return (
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">
         <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
               {step === "REGISTER" ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-gray-500 mt-2">
               {step === "OTP" ? "Enter the code sent to your phone" : "Login to manage your business"}
            </p>
         </div>

         {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
               {error}
            </div>
         )}

         {step === "PHONE" && (
            <>
               <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
               >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                     <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                     <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                     <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                     <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
               </button>

               <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                     <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                     <span className="px-2 bg-white text-gray-500">Or continue with phone</span>
                  </div>
               </div>

               <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                     <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                           +91
                        </span>
                        <input
                           type="tel"
                           value={phone}
                           onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                           className="flex-1 block w-full rounded-none rounded-r-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                           placeholder="9876543210"
                           required
                        />
                     </div>
                  </div>
                  <button
                     type="submit"
                     disabled={loading}
                     className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                  >
                     {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Send OTP"}
                  </button>
               </form>
            </>
         )}

         {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">One Time Password</label>
                  <input
                     type="text"
                     value={otp}
                     onChange={(e) => setOtp(e.target.value)}
                     className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                     placeholder="123456"
                     required
                  />
               </div>
               <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
               >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify & Login"}
               </button>
               <button
                  type="button"
                  onClick={() => setStep("PHONE")}
                  className="w-full text-sm text-indigo-600 hover:text-indigo-500"
               >
                  Change Number
               </button>
            </form>
         )}

         {step === "REGISTER" && (
            <form onSubmit={handleRegister} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                     type="text"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                     placeholder="John Doe"
                     required
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <div className="flex">
                     <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        +91
                     </span>
                     <input
                        type="tel"
                        value={phone}
                        readOnly
                        className="flex-1 block w-full rounded-none rounded-r-lg border-gray-300 bg-gray-50 sm:text-sm p-3 border text-gray-500"
                     />
                  </div>
               </div>
               <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
               >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Register Account"}
               </button>
               <button
                  type="button"
                  onClick={() => setStep("PHONE")}
                  className="w-full text-sm text-gray-600 hover:text-gray-900"
               >
                  Back to Login
               </button>
            </form>
         )}
      </div>
   );
}
