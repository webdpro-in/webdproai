"use client";

import { useState } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { apiPayments } from "@/lib/api";

export default function SettingsPage() {
   const [loading, setLoading] = useState(false);
   const [status, setStatus] = useState<"PENDING" | "ACTIVE">("PENDING");
   const [error, setError] = useState("");

   const handleOnboard = async () => {
      setLoading(true);
      setError("");

      try {
         // Hardcoded Mock Tenant Data from Auth Context (in real app)
         const mockTenant = {
            tenant_id: "tenant_123",
            name: "John Doe",
            email: "john@example.com",
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
            <p className="text-gray-500 mt-1">Manage payments and account details.</p>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
               <h2 className="text-lg font-semibold text-gray-900">Payment Setup</h2>
               <p className="text-sm text-gray-500">Configure how you receive money from customers.</p>
            </div>

            <div className="p-6">
               <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${status === 'ACTIVE' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                     {status === 'ACTIVE' ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                     ) : (
                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                     )}
                  </div>

                  <div className="flex-1">
                     <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Razorpay Merchant Account</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                           }`}>
                           {status}
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
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                           >
                              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                              Enable Payments Now
                           </button>
                        ) : (
                           <button
                              disabled
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-gray-50"
                           >
                              Connected
                           </button>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
