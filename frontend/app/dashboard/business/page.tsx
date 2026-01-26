"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BusinessDashboard() {
   const router = useRouter();
   const [user, setUser] = useState<any>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
         router.push("/login");
         return;
      }

      // Decode token to get user info (simplified)
      try {
         const payload = JSON.parse(atob(token.split(".")[1]));
         setUser(payload.user);

         if (payload.user.role !== "BUSINESS_OWNER") {
            router.push("/login");
         }
      } catch (error) {
         router.push("/login");
      } finally {
         setLoading(false);
      }
   }, [router]);

   const handleLogout = () => {
      localStorage.removeItem("auth_token");
      router.push("/login");
   };

   if (loading) {
      return (
         <div className="min-h-screen flex items-center justify-center">
            <div className="text-lg">Loading...</div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gray-50">
         {/* Header */}
         <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
               <div>
                  <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
                  <p className="text-sm text-gray-600">Welcome, {user?.email || user?.mobile}</p>
               </div>
               <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
               >
                  Logout
               </button>
            </div>
         </header>

         {/* Main Content */}
         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
               <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Total Stores</div>
                  <div className="text-3xl font-bold text-purple-600">0</div>
               </div>
               <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Active Orders</div>
                  <div className="text-3xl font-bold text-blue-600">0</div>
               </div>
               <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Revenue</div>
                  <div className="text-3xl font-bold text-green-600">₹0</div>
               </div>
               <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Products</div>
                  <div className="text-3xl font-bold text-orange-600">0</div>
               </div>
            </div>

            {/* Generate Store CTA */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white text-center">
               <h2 className="text-3xl font-bold mb-4">Create Your First Store</h2>
               <p className="text-lg mb-6">
                  Generate a fully functional ecommerce website in under 10 minutes using AI
               </p>
               <button
                  onClick={() => router.push("/generate")}
                  className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:shadow-lg transition-all"
               >
                  🚀 Generate New Store
               </button>
            </div>

            {/* My Stores */}
            <div className="mt-8">
               <h3 className="text-xl font-bold mb-4">My Stores</h3>
               <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  No stores yet. Create your first store to get started!
               </div>
            </div>
         </main>
      </div>
   );
}
