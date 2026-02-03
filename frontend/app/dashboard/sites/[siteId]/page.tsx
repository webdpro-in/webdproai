'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiStores, apiInventory, apiOrders } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import {
   ShoppingBag,
   Package,
   Globe,
   Edit3,
   ExternalLink,
   BarChart,
   TrendingUp,
   Users,
   DollarSign,
   Loader2,
   AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function SiteDetailPage() {
   const router = useRouter();
   const params = useParams();
   const siteId = params?.siteId as string;

   const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'orders'>('overview');
   const [store, setStore] = useState<any>(null);
   const [products, setProducts] = useState<any[]>([]);
   const [orders, setOrders] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      if (!isAuthenticated()) {
         router.push('/login');
         return;
      }
      if (siteId) {
         loadData();
      }
   }, [siteId]);

   const loadData = async () => {
      try {
         setLoading(true);
         const [storeRes, productsRes, ordersRes] = await Promise.all([
            apiStores.getStore(siteId),
            apiInventory.getProducts(siteId).catch(() => []), // Fallback if inventory service fails or empty
            apiOrders.listOrders(siteId).catch(() => [])
         ]);

         setStore(storeRes.store);
         setProducts(Array.isArray(productsRes) ? productsRes : []);
         setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      } catch (err: any) {
         console.error('Failed to load site data:', err);
         setError('Failed to load site details. Please check your connection.');
      } finally {
         setLoading(false);
      }
   };

   if (loading) {
      return (
         <div className="flex h-screen items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
         </div>
      );
   }

   if (error || !store) {
      return (
         <div className="p-8 text-center text-red-600 bg-red-50 m-4 rounded-xl border border-red-200">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-bold">Error</h3>
            <p>{error || 'Store not found'}</p>
            <Button className="mt-4" onClick={loadData}>Retry</Button>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gray-50 pb-20">
         {/* Top Navigation Bar */}
         <div className="bg-white border-b sticky top-0 z-30 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
               <Link href="/dashboard/sites" className="text-gray-500 hover:text-gray-900 transition-colors">
                  Websites
               </Link>
               <span className="text-gray-300">/</span>
               <span className="font-semibold text-gray-900 line-clamp-1">{store.prompt || 'My Store'}</span>
            </div>
            <div className="flex items-center gap-3">
               {store.live_url && (
                  <a
                     href={store.live_url}
                     target="_blank"
                     rel="noreferrer"
                     className="hidden sm:flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                     <ExternalLink className="w-4 h-4" />
                     View Live
                  </a>
               )}
               <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                  onClick={() => router.push(`/dashboard/sites/${siteId}/editor`)}
               >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Website
               </Button>
            </div>
         </div>

         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
               <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<BarChart className="w-4 h-4" />}>Overview</TabButton>
               <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package className="w-4 h-4" />}>Inventory</TabButton>
               <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ShoppingBag className="w-4 h-4" />}>Orders</TabButton>
            </div>

            {/* Content Area */}
            {activeTab === 'overview' && (
               <div className="space-y-6 animate-fade-in">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <StatCard title="Total Revenue" value="$0.00" icon={<DollarSign className="w-5 h-5 text-green-600" />} />
                     <StatCard title="Active Orders" value={orders.length.toString()} icon={<ShoppingBag className="w-5 h-5 text-blue-600" />} />
                     <StatCard title="Total Traffic" value="124" icon={<Users className="w-5 h-5 text-purple-600" />} subtitle="+12% this week" />
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                     <h3 className="text-lg font-bold text-gray-900 mb-4">Store Performance</h3>
                     <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-400 flex items-center gap-2">
                           <TrendingUp className="w-5 h-5" />
                           Traffic analytics will appear here
                        </p>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'inventory' && (
               <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-slide-up">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                     <h3 className="text-lg font-bold text-gray-900">Products ({products.length})</h3>
                     <Button size="sm" variant="outline">Add Product</Button>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                           <tr>
                              <th className="px-6 py-4">Name</th>
                              <th className="px-6 py-4">Price</th>
                              <th className="px-6 py-4">Stock</th>
                              <th className="px-6 py-4">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {products.length === 0 ? (
                              <tr>
                                 <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                    No products found. AI usually generates initial inventory.
                                 </td>
                              </tr>
                           ) : (
                              products.map((product: any, i) => (
                                 <tr key={i} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{product.name || 'Unnamed Product'}</td>
                                    <td className="px-6 py-4">${product.price || '0.00'}</td>
                                    <td className="px-6 py-4">{product.stock || 0} units</td>
                                    <td className="px-6 py-4">
                                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                          Active
                                       </span>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {activeTab === 'orders' && (
               <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-slide-up">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                     <h3 className="text-lg font-bold text-gray-900">Recent Orders ({orders.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                           <tr>
                              <th className="px-6 py-4">Order ID</th>
                              <th className="px-6 py-4">Customer</th>
                              <th className="px-6 py-4">Amount</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Date</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {orders.length === 0 ? (
                              <tr>
                                 <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                    No orders yet. Share your store link to get started!
                                 </td>
                              </tr>
                           ) : (
                              orders.map((order: any, i) => (
                                 <tr key={i} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs">{order.order_id}</td>
                                    <td className="px-6 py-4">{order.customer_name || 'Guest'}</td>
                                    <td className="px-6 py-4">${order.total_amount || '0.00'}</td>
                                    <td className="px-6 py-4">
                                       <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                          }`}>
                                          {order.status || 'PENDING'}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}

function TabButton({ active, onClick, children, icon }: any) {
   return (
      <button
         onClick={onClick}
         className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${active
               ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
               : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }
         `}
      >
         {icon}
         {children}
      </button>
   );
}

function StatCard({ title, value, icon, subtitle }: any) {
   return (
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
         <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-500">{title}</h4>
            <div className="p-2 bg-gray-50 rounded-lg">
               {icon}
            </div>
         </div>
         <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {subtitle && <span className="text-xs text-green-600 font-medium mb-1">{subtitle}</span>}
         </div>
      </div>
   );
}
