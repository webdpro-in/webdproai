"use client";

import { Search, Filter, Eye, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { apiOrders, apiStores } from "@/lib/api";
import Link from "next/link";

export default function OrdersPage() {
   const [searchTerm, setSearchTerm] = useState("");
   const [orders, setOrders] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      loadOrders();
   }, []);

   const loadOrders = async () => {
      setLoading(true);
      setError(null);
      try {
         const storesRes = await apiStores.getStores();
         const stores = storesRes?.stores ?? [];
         const storeId = stores[0]?.store_id ?? stores[0]?.storeId;

         if (!storeId) {
            setOrders([]);
            setError("Create a store first to view orders.");
            return;
         }

         const data = await apiOrders.listOrders(storeId);
         setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
         const msg = e instanceof Error ? e.message : "Failed to load orders.";
         setError(msg);
         setOrders([]);
         console.error("Failed to load orders", e);
      } finally {
         setLoading(false);
      }
   };

   const getStatusColor = (status: string) => {
      switch (status) {
         case "CONFIRMED": return "bg-green-100 text-green-800";
         case "PENDING_PAYMENT": return "bg-yellow-100 text-yellow-800";
         case "DELIVERED": return "bg-blue-100 text-blue-800";
         default: return "bg-gray-100 text-gray-800";
      }
   };

   return (
      <div className="max-w-6xl mx-auto space-y-8">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
               <p className="text-gray-500 mt-1">Track and manage your customer orders.</p>
            </div>
            <div className="flex items-center gap-2">
               <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
               </button>
               <button className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">
                  Export
               </button>
            </div>
         </div>

         {error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
               <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">{error}</p>
                  {error.includes("Create a store") && (
                     <Link href="/dashboard/sites/new" className="text-sm text-amber-700 underline mt-1 inline-block">
                        Create a store →
                     </Link>
                  )}
               </div>
            </div>
         )}

         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-100">
               <div className="relative max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                     type="text"
                     className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                     placeholder="Search orders..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                     <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Order ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Amount
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                           <span className="sr-only">Actions</span>
                        </th>
                     </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                     {loading ? (
                        <tr>
                           <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-500" />
                              Loading orders...
                           </td>
                        </tr>
                     ) : orders.length === 0 ? (
                        <tr>
                           <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                              No orders found.
                           </td>
                        </tr>
                     ) : (
                        orders.map((order) => (
                           <tr key={order.order_id || order.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                 {order.order_id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                 {order.customer_id || "Guest"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                 {new Date(order.created_at || Date.now()).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                    {order.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                 ₹{((order.total_amount || 0)).toLocaleString('en-IN')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                 <button className="text-indigo-600 hover:text-indigo-900">
                                    <Eye className="h-5 w-5" />
                                 </button>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
}
