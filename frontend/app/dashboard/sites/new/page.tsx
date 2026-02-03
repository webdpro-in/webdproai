"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Wand2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { apiStores } from "@/lib/api";

export default function CreateSitePage() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const [loading, setLoading] = useState(false);
   const [formData, setFormData] = useState({
      businessName: "",
      description: "",
      theme: "modern", // 'modern' | 'playful' | 'elegant'
   });

   // Auto-fill from URL prompt
   useEffect(() => {
      const promptParam = searchParams.get('prompt');
      if (promptParam) {
         setFormData(prev => ({ ...prev, description: decodeURIComponent(promptParam) }));
      }
   }, [searchParams]);

   const [error, setError] = useState<string | null>(null);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
         const prompt = [
            `Business: ${formData.businessName.trim()}.`,
            formData.description.trim(),
            `Style: ${formData.theme}.`
         ].filter(Boolean).join(" ");

         const result = await apiStores.generateStore({
            prompt,
            storeType: "general",
            language: "en",
            currency: "INR"
         });

         if (!result.success || !result.store) {
            setError("Generation failed.");
            return;
         }

         console.log('[CreateSite] Generation successful:', {
            storeId: result.store.store_id,
            configSections: result.store.config?.sections?.length || 0,
            businessName: result.store.config?.name || result.store.config?.businessName,
            businessType: result.store.config?.businessType || result.store.config?.storeType
         });

         const configString = encodeURIComponent(JSON.stringify(result.store.config));
         router.push(`/dashboard/sites/${result.store.store_id}/editor?config=${configString}`);
      } catch (err) {
         console.error("Generation failed:", err);
         setError(err instanceof Error ? err.message : "Failed to generate website. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
         <div className="mb-6 sm:mb-8">
            <Link href="/dashboard/sites" className="text-sm text-gray-500 hover:text-gray-900 flex items-center mb-4 transition-colors w-fit">
               <ArrowLeft className="h-4 w-4 mr-1 shrink-0" />
               Back to Websites
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Website</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Describe your business, and our AI will build a complete store for you.</p>
         </div>

         <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {loading ? (
               <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
                  <div className="relative">
                     <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl animate-pulse" />
                     <Wand2 className="h-14 w-14 sm:h-16 sm:w-16 text-indigo-600 relative z-10 animate-pulse" />
                  </div>
                  <h3 className="mt-6 text-lg sm:text-xl font-bold text-gray-900">Checking system readiness...</h3>
                  <p className="text-gray-500 mt-2 max-w-sm text-sm sm:text-base">
                     Verifying connections to AI, Database, and Storage. Generation will begin shortly.
                  </p>
                  <div className="w-full max-w-xs sm:w-64 bg-gray-100 rounded-full h-2 mt-8 overflow-hidden">
                     <div className="bg-indigo-600 h-2 rounded-full w-1/4 animate-progress-indeterminate" />
                  </div>
               </div>
            ) : (
               <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                  {error && (
                     <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-1">
                        <p className="text-red-700 text-sm font-medium">{error}</p>
                        <p className="text-red-600 text-xs">
                           Please check your connection and try again.
                        </p>
                     </div>
                  )}

                  {/* Business Name */}
                  <div>
                     <label className="block text-sm font-semibold text-gray-900 mb-2">
                        What is your Business Name?
                     </label>
                     <input
                        type="text"
                        required
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        placeholder="e.g., Urban Threads, The Coffee House"
                        className="block w-full px-4 py-3 rounded-lg border-gray-200 border focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50 focus:bg-white transition-colors"
                     />
                  </div>

                  {/* Description */}
                  <div>
                     <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Describe your business & products
                     </label>
                     <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="e.g., We sell sustainable cotton t-shirts with minimalist designs. Our target audience is young adults who care about the environment."
                        className="block w-full px-4 py-3 rounded-lg border-gray-200 border focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50 focus:bg-white transition-colors"
                     />
                     <p className="mt-2 text-xs text-gray-500">
                        The more details you provide, the better the AI results will be.
                     </p>
                  </div>

                  {/* Theme Selection (Optional) */}
                  <div>
                     <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Choose a Style
                     </label>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {['modern', 'playful', 'elegant'].map((theme) => (
                           <label
                              key={theme}
                              className={`
                             relative flex items-center justify-center px-4 py-3 rounded-xl border-2 cursor-pointer transition-all
                             ${formData.theme === theme
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-100 hover:border-gray-200 text-gray-600 bg-white hover:bg-gray-50'}
                          `}
                           >
                              <input
                                 type="radio"
                                 name="theme"
                                 value={theme}
                                 checked={formData.theme === theme}
                                 onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                                 className="sr-only"
                              />
                              <span className="capitalize font-medium">{theme}</span>
                           </label>
                        ))}
                     </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50">
                     <button
                        type="submit"
                        className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform active:scale-[0.99] touch-manipulation"
                     >
                        <Wand2 className="h-5 w-5 mr-2 shrink-0" />
                        Generate Website
                     </button>
                  </div>
               </form>
            )}
         </div>
      </div>
   );
}
