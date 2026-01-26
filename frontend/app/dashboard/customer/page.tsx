"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerDashboard() {
   const router = useRouter();
   const [user, setUser] = useState<any>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
         router.push("/login");
         return;
      }

      try {
         const payload = JSON.parse(atob(token.split(".")[1]));
         setUser(payload.user);

         if (payload.user.role !== "CUSTOMER") {
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
         <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
               <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
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

         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Active Orders</div>
                  <div className="text-3xl font-bold text-blue-600">0</div>
               </div>
               <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Completed Orders</div>
                  <div className="text-3xl font-bold text-green-600">0</div>
               </div>
               <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Total Spent</div>
                  <div className="text-3xl font-bold text-purple-600">₹0</div>
               </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
               <h3 className="text-xl font-bold mb-4">Recent Orders</h3>
               <p className="text-gray-500">No orders yet. Start shopping!</p>
            </div>
         </main>
      </div>
   );
}
