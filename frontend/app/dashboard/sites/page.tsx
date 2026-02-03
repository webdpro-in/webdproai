'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiStores } from '@/lib/api';
import { getUser, isAuthenticated } from '@/lib/auth';

interface Store {
   store_id: string;
   store_type: string;
   status: string;
   prompt: string;
   preview_url?: string;
   live_url?: string;
   domain?: string;
   created_at: string;
   updated_at: string;
}

export default function SitesPage() {
   const router = useRouter();
   const [stores, setStores] = useState<Store[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const user = getUser();

   useEffect(() => {
      if (!isAuthenticated()) {
         router.push('/login');
         return;
      }

      loadStores();
   }, [router]);

   const loadStores = async () => {
      try {
         setLoading(true);
         setError(null);
         const response = await apiStores.getStores();

         setStores(response.stores || []);
      } catch (err: any) {
         console.error('Failed to load stores:', err);
         setError(err.message || 'Failed to load stores');
      } finally {
         setLoading(false);
      }
   };

   const getStatusColor = (status: string) => {
      switch (status.toUpperCase()) {
         case 'PUBLISHED':
            return 'bg-green-100 text-green-800';
         case 'DRAFT':
            return 'bg-yellow-100 text-yellow-800';
         case 'GENERATING':
            return 'bg-blue-100 text-blue-800';
         case 'ERROR':
            return 'bg-red-100 text-red-800';
         default:
            return 'bg-gray-100 text-gray-800';
      }
   };

   if (loading) {
      return (
         <div className="min-h-screen bg-white p-8">
            <div className="max-w-7xl mx-auto">
               <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                     <p className="mt-4 text-gray-600">Loading your sites...</p>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h1 className="text-3xl font-bold text-gray-900">My Sites</h1>
                  <p className="mt-2 text-gray-600">
                     Manage your AI-generated websites
                  </p>
               </div>
               <button
                  onClick={() => router.push('/dashboard/sites/new')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
               >
                  + Create New Site
               </button>
            </div>

            {/* Error Message */}
            {error && (
               <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                  <button
                     onClick={loadStores}
                     className="mt-2 text-red-600 hover:text-red-800 font-medium"
                  >
                     Try Again
                  </button>
               </div>
            )}

            {/* Sites Grid */}
            {stores.length === 0 ? (
               <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg
                     className="mx-auto h-16 w-16 text-gray-400"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                     />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No sites yet</h3>
                  <p className="mt-2 text-gray-600">
                     Get started by creating your first AI-powered website
                  </p>
                  <button
                     onClick={() => router.push('/dashboard/sites/new')}
                     className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                     Create Your First Site
                  </button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stores.map((store) => (
                     <div
                        key={store.store_id}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/dashboard/sites/${store.store_id}`)}
                     >
                        {/* Status Badge */}
                        <div className="flex justify-between items-start mb-4">
                           <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                 store.status
                              )}`}
                           >
                              {store.status}
                           </span>
                           <span className="text-xs text-gray-500">
                              {store.store_type || 'general'}
                           </span>
                        </div>

                        {/* Store Info */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                           {store.prompt || 'Untitled Site'}
                        </h3>

                        {store.domain && (
                           <p className="text-sm text-blue-600 mb-2 line-clamp-1">
                              {store.domain}
                           </p>
                        )}

                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                           {store.prompt}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                           {store.status === 'PUBLISHED' && store.live_url && (
                              <a
                                 href={store.live_url}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors text-center"
                                 onClick={(e) => e.stopPropagation()}
                              >
                                 View Live
                              </a>
                           )}
                           {store.status === 'DRAFT' && (
                              <button
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/dashboard/sites/${store.store_id}/editor`);
                                 }}
                                 className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                 Edit
                              </button>
                           )}
                           <button
                              onClick={(e) => {
                                 e.stopPropagation();
                                 router.push(`/dashboard/sites/${store.store_id}`);
                              }}
                              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                           >
                              Manage
                           </button>
                        </div>

                        {/* Timestamp */}
                        <p className="text-xs text-gray-500 mt-4">
                           Created {new Date(store.created_at).toLocaleDateString()}
                        </p>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
