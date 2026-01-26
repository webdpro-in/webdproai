"use client";

import { Store, ShoppingBag, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardHome() {
   const [userName, setUserName] = useState("Merchant");

   // Quick fetch of user details could go here
   useEffect(() => {
      // Check if we have user info
   }, []);

   return (
      <div className="max-w-6xl mx-auto space-y-8">
         {/* Welcome Section */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
               <p className="text-gray-500 mt-1">Manage your business and websites.</p>
            </div>
            <Link
               href="/dashboard/sites/new"
               className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
               <Plus className="h-5 w-5 mr-2" />
               Create New Website
            </Link>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Websites Card */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                     <Store className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                     Active
                  </span>
               </div>
               <p className="text-sm font-medium text-gray-500">Total Websites</p>
               <h3 className="text-2xl font-bold text-gray-900 mt-1">0</h3>
               <div className="mt-4 pt-4 border-t border-gray-50">
                  <Link href="/dashboard/sites" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center">
                     View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
               </div>
            </div>

            {/* Orders Card */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                     <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
               </div>
               <p className="text-sm font-medium text-gray-500">Pending Orders</p>
               <h3 className="text-2xl font-bold text-gray-900 mt-1">0</h3>
               <div className="mt-4 pt-4 border-t border-gray-50">
                  <Link href="/dashboard/orders" className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center">
                     View Orders <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
               </div>
            </div>

            {/* Revenue Card (Placeholder) */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                     <span className="text-lg font-bold text-green-600">₹</span>
                  </div>
               </div>
               <p className="text-sm font-medium text-gray-500">Total Revenue</p>
               <h3 className="text-2xl font-bold text-gray-900 mt-1">₹0.00</h3>
            </div>
         </div>

         {/* Setup Guide / Get Started */}
         <div className="p-6 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-2xl text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
               <div>
                  <h3 className="text-xl font-bold">1. Setup Payments</h3>
                  <p className="text-indigo-100 mt-1 max-w-lg">
                     Connect your bank account to start accepting payments directly from customers.
                     Quick 60-second verify.
                  </p>
               </div>
               <Link
                  href="/dashboard/settings"
                  className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap"
               >
                  Enable Payments
               </Link>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
         </div>
      </div>
   );
}
