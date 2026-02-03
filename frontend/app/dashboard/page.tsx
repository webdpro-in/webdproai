'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Store, ShoppingBag, IndianRupee, ArrowRight, Loader2 } from 'lucide-react';
import { apiStores } from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function Dashboard() {
   const router = useRouter();
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState({
      websites: 0,
      orders: 0,
      revenue: 0
   });

   useEffect(() => {
      loadStats();
   }, []);

   const loadStats = async () => {
      try {
         const response = await apiStores.getStores();
         // If no stores, use 0 or demo data logic if needed
         const stores = response.stores || [];
         setStats({
            websites: stores.length,
            orders: 0, // Mock for now until Logic is ready
            revenue: 0  // Mock for now until Logic is ready
         });
      } catch (error) {
         console.error('Failed to load stats', error);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="space-y-8 animate-fade-in">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
               <p className="text-gray-600 mt-1">Manage your business and websites.</p>
            </div>
            <Button
               onClick={() => router.push('/dashboard/sites/new')}
               className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 shadow-lg shadow-indigo-200"
            >
               + Create New Website
            </Button>
         </div>

         {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
               ))}
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Total Websites Card */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group transition-all hover:-translate-y-1 hover:shadow-md">
                  <div className="absolute top-6 right-6">
                     <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">Active</span>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                     <Store className="w-6 h-6" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Total Websites</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.websites}</h3>
                  <button
                     onClick={() => router.push('/dashboard/sites')}
                     className="mt-6 text-sm text-indigo-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
                  >
                     View All <ArrowRight className="w-4 h-4" />
                  </button>
               </div>

               {/* Pending Orders Card */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group transition-all hover:-translate-y-1 hover:shadow-md">
                  <div className="absolute bottom-6 right-6 w-1 h-8 bg-yellow-400 rounded-full" />
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                     <ShoppingBag className="w-6 h-6" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Pending Orders</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.orders}</h3>
                  <button className="mt-6 text-sm text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
                     View Orders <ArrowRight className="w-4 h-4" />
                  </button>
               </div>

               {/* Total Revenue Card */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group transition-all hover:-translate-y-1 hover:shadow-md">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
                     <IndianRupee className="w-6 h-6" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{stats.revenue.toFixed(2)}</h3>
               </div>
            </div>
         )}

         {/* Setup Payments Banner */}
         <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
               <h2 className="text-2xl font-bold">1. Setup Payments</h2>
               <p className="text-indigo-100 max-w-xl">
                  Connect your bank account to start accepting payments directly from customers. Quick 60-second verification.
               </p>
            </div>
            <Button className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-6 text-lg rounded-xl font-bold shadow-sm whitespace-nowrap">
               Enable Payments
            </Button>
         </div>
      </div>
   );
}
