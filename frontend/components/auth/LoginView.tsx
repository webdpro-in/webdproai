"use client";

import { useState } from "react";
import { sendOtp, verifyOtp, registerUser } from "@/lib/auth";
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

      if (res.success && res.tokens) {
         // Store tokens (HTTP Only cookie is better, but localStorage for MVP)
         localStorage.setItem("token", res.tokens.idToken);
         localStorage.setItem("refresh_token", res.tokens.refreshToken);
         router.push("/dashboard");
      } else {
         setError(res.message || "Invalid OTP");
      }
   };

   const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      const res = await registerUser(phone, name);
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
