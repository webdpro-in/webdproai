"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle, AlertCircle, Building2, CreditCard, User, Mail, Phone, LogOut } from "lucide-react";
import { apiPayments } from "@/lib/api";

interface UserProfile {
   name: string;
   email: string;
   phone: string;
   role: string;
   tenant_id: string;
}

export default function SettingsPage() {
   const router = useRouter();
   const [loading, setLoading] = useState(false);
   const [status, setStatus] = useState<"PENDING" | "ACTIVE">("PENDING");
   const [error, setError] = useState("");
   const [user, setUser] = useState<UserProfile | null>(null);

   // Logout State
   const [showLogoutModal, setShowLogoutModal] = useState(false);
   const [logoutInput, setLogoutInput] = useState("");

   const handleLogout = () => {
      // Clear all localStorage items
      localStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
         document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Trigger event for other components
      window.dispatchEvent(new Event('logout'));
      
      // Force redirect to login
      window.location.href = "/login";
   };


   useEffect(() => {
      // Load user profile
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
         try {
            setUser(JSON.parse(storedUser));
         } catch (e) {
            console.error("Failed to parse user data", e);
         }
      }
   }, []);

   const handleOnboard = async () => {
      setLoading(true);
      setError("");

      try {
         // Hardcoded Mock Tenant Data from Auth Context (in real app)
         const mockTenant = {
            tenant_id: user?.tenant_id || "tenant_123",
            name: user?.name || "John Doe",
            email: user?.email || "john@example.com",
            business_name: "My Great Store"
         };

         await apiPayments.onboardMerchant(mockTenant);

         // Success
         setStatus("ACTIVE");
      } catch (err) {
         setError("Failed to enable payments. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="max-w-4xl mx-auto space-y-8">
         <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 mt-1">Manage your account, payments, and business details.</p>
         </div>

         {/* Account Information */}
         {user && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
                  <p className="text-sm text-gray-500">Your profile and business details.</p>
               </div>

               <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <User className="w-4 h-4" />
                           <span className="font-medium">Name</span>
                        </div>
                        <p className="text-gray-900 font-medium pl-6">{user.name}</p>
                     </div>

                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <Mail className="w-4 h-4" />
                           <span className="font-medium">Email</span>
                        </div>
                        <p className="text-gray-900 font-medium pl-6">{user.email}</p>
                     </div>

                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <Phone className="w-4 h-4" />
                           <span className="font-medium">Phone</span>
                        </div>
                        <p className="text-gray-900 font-medium pl-6">{user.phone || 'Not provided'}</p>
                     </div>

                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <Building2 className="w-4 h-4" />
                           <span className="font-medium">Tenant ID</span>
                        </div>
                        <p className="text-gray-900 font-mono text-sm pl-6">{user.tenant_id || 'N/A'}</p>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Payment Setup */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
               <h2 className="text-lg font-semibold text-gray-900">Payment Setup</h2>
               <p className="text-sm text-gray-500">Configure how you receive money from customers.</p>
            </div>

            <div className="p-6">
               <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${status === 'ACTIVE' ? 'bg-green-100' : 'bg-amber-100'}`}>
                     {status === 'ACTIVE' ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                     ) : (
                        <AlertCircle className="h-6 w-6 text-amber-600" />
                     )}
                  </div>

                  <div className="flex-1">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <CreditCard className="w-5 h-5 text-gray-600" />
                           <h3 className="font-medium text-gray-900">Razorpay Merchant Account</h3>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'ACTIVE'
                           ? 'bg-green-100 text-green-800'
                           : 'bg-amber-100 text-amber-800'
                           }`}>
                           {status === 'ACTIVE' ? 'Connected' : 'Not Connected'}
                        </span>
                     </div>

                     <p className="text-sm text-gray-500 mt-2 max-w-xl">
                        {status === 'ACTIVE'
                           ? "Your payments are active. Money will be settled directly to your connected bank account."
                           : "Enable payments to start selling. Verification takes less than 60 seconds."}
                     </p>

                     {status === 'PENDING' && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                           <h4 className="text-sm font-medium text-gray-900 mb-3">Required Details</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="text-sm text-gray-500">• Bank Account Number</div>
                              <div className="text-sm text-gray-500">• IFSC Code</div>
                              <div className="text-sm text-gray-500">• Business Name</div>
                              <div className="text-sm text-gray-500">• GSTIN (Optional)</div>
                           </div>
                        </div>
                     )}

                     {error && (
                        <p className="text-sm text-red-600 mt-4">{error}</p>
                     )}

                     <div className="mt-6">
                        {status === 'PENDING' ? (
                           <button
                              onClick={handleOnboard}
                              disabled={loading}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                           >
                              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                              Connect Razorpay Now
                           </button>
                        ) : (
                           <button
                              disabled
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-gray-50 cursor-not-allowed"
                           >
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Connected
                           </button>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>
         {/* Sign Out Section */}
         <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
            <div className="p-6 border-b border-red-100 bg-red-50">
               <h2 className="text-lg font-semibold text-red-900">Sign Out</h2>
               <p className="text-sm text-red-700">End your current session.</p>
            </div>
            <div className="p-6">
               <button
                  onClick={() => setShowLogoutModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
               >
                  <LogOut className="w-4 h-4" />
                  Sign Out
               </button>
            </div>
         </div>

         {/* Logout Confirmation Modal */}
         {showLogoutModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                  <h3 className="text-lg font-bold text-gray-900">Confirm Sign Out</h3>
                  <p className="text-sm text-gray-600">Please type <strong>logout</strong> below to confirm.</p>
                  <input
                     type="text"
                     value={logoutInput}
                     onChange={(e) => setLogoutInput(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter' && logoutInput.toLowerCase() === 'logout') {
                           handleLogout();
                        }
                     }}
                     placeholder="Type logout"
                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                     autoFocus
                  />
                  <div className="flex gap-3 justify-end pt-2">
                     <button
                        onClick={() => { setShowLogoutModal(false); setLogoutInput(''); }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                     >
                        Cancel
                     </button>
                     <button
                        onClick={handleLogout}
                        disabled={logoutInput.toLowerCase() !== 'logout'}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                     >
                        Sign Out
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
