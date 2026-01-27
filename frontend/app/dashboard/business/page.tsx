"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiStores } from "@/lib/api";
import { Loader2, Plus, ExternalLink, Settings } from "lucide-react";

export default function BusinessDashboard() {
   const router = useRouter();
   const [user, setUser] = useState<any>(null);
   const [stores, setStores] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   useEffect(() => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      
      if (!token || !userData) {
         router.push("/login");
         return;
      }

      try {
         const parsedUser = JSON.parse(userData);
         setUser(parsedUser);

         if (parsedUser.role !== "BUSINESS_OWNER") {
            router.push("/login");
            return;
         }

         // Load stores
         loadStores();
      } catch (error) {
         console.error("User data parse error:", error);
         router.push("/login");
      }
   }, [router]);

   const loadStores = async () => {
      try {
         const response = await apiStores.getStores();
         setStores(response.stores || []);
      } catch (error: any) {
         setError(error.message || "Failed to load stores");
      } finally {
         setLoading(false);
      }
   };

   const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      router.push("/login");
   };

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'PUBLISHED': return 'bg-green-100 text-green-800';
         case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
         case 'GENERATING': return 'bg-blue-100 text-blue-800';
         case 'ERROR': return 'bg-red-100 text-red-800';
         default: return 'bg-gray-100 text-gray-800';
      }
   };

   if (loading) {
      return (
         <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
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
                  <p className="text-sm text-gray-600">Welcome back!</p>
               </div>
               <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
               >
                  Logout
               </button>
            </div>
         </header>

         {/* Main Content */}
         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && (
               <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
               </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
               <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Total Stores</div>
                  <div className="text-3xl font-bold text-purple-600">{stores.length}</div>
               </div>
               <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Published</div>
                  <div className="text-3xl font-bold text-green-600">
                     {stores.filter(s => s.status === 'PUBLISHED').length}
                  </div>
               </div>
               <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Drafts</div>
                  <div className="text-3xl font-bold text-yellow-600">
                     {stores.filter(s => s.status === 'DRAFT').length}
                  </div>
               </div>
               <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Generating</div>
                  <div className="text-3xl font-bold text-blue-600">
                     {stores.filter(s => s.status === 'GENERATING').length}
                  </div>
               </div>
            </div>

            {/* Generate Store CTA */}
            {stores.length === 0 && (
               <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">Create Your First Store</h2>
                  <p className="text-lg mb-6">
                     Generate a fully functional ecommerce website in under 10 minutes using AI
                  </p>
                  <button
                     onClick={() => router.push("/generate")}
                     className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center"
                  >
                     <Plus className="h-5 w-5 mr-2" />
                     Generate New Store
                  </button>
               </div>
            )}

            {/* My Stores */}
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold">My Stores</h3>
               {stores.length > 0 && (
                  <button
                     onClick={() => router.push("/generate")}
                     className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center"
                  >
                     <Plus className="h-4 w-4 mr-2" />
                     New Store
                  </button>
               )}
            </div>

            {stores.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stores.map((store) => (
                     <div key={store.store_id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                        <div className="p-6">
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                 <h4 className="font-semibold text-gray-900 mb-1">
                                    {store.config?.businessName || `Store ${store.store_id.substring(0, 8)}`}
                                 </h4>
                                 <p className="text-sm text-gray-600">
                                    {store.store_type || 'General Store'}
                                 </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(store.status)}`}>
                                 {store.status}
                              </span>
                           </div>

                           <div className="text-sm text-gray-500 mb-4">
                              Created: {new Date(store.created_at).toLocaleDateString()}
                           </div>

                           <div className="flex space-x-2">
                              {store.live_url && (
                                 <a
                                    href={store.live_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors text-center inline-flex items-center justify-center"
                                 >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Visit
                                 </a>
                              )}
                              {store.preview_url && !store.live_url && (
                                 <a
                                    href={store.preview_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors text-center inline-flex items-center justify-center"
                                 >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Preview
                                 </a>
                              )}
                              <button
                                 onClick={() => router.push(`/dashboard/stores/${store.store_id}`)}
                                 className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center"
                              >
                                 <Settings className="h-4 w-4 mr-1" />
                                 Manage
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  No stores yet. Create your first store to get started!
               </div>
            )}
         </main>
      </div>
   );
}
