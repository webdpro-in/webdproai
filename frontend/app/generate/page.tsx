"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiStores } from "@/lib/api";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";

export default function GenerateStorePage() {
   const router = useRouter();
   const [prompt, setPrompt] = useState("");
   const [storeType, setStoreType] = useState("general");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
   const [result, setResult] = useState<any>(null);

   const handleGenerate = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      setResult(null);

      try {
         const response = await apiStores.generateStore({
            prompt: prompt.trim(),
            storeType,
            language: "en",
            currency: "INR"
         });

         if (!response.success || !response.store) {
            setError("Generation failed.");
            return;
         }

         setResult(response.store);
      } catch (err) {
         setError(err instanceof Error ? err.message : "Failed to generate store.");
      } finally {
         setLoading(false);
      }
   };

   const handlePublish = async () => {
      if (!result) return;

      try {
         setLoading(true);
         const response = await apiStores.publishStore(result.store_id);
         console.log("Store published:", response.store);
         router.push(`/sites/${result.store_id}`);
      } catch (error: any) {
         setError(error.message || "Failed to publish store");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-gray-50">
         <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
               <button
                  onClick={() => router.back()}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 touch-manipulation"
                  aria-label="Go back"
               >
                  <ArrowLeft className="h-5 w-5" />
               </button>
               <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Generate AI Store</h1>
                  <p className="text-sm text-gray-600">Describe your business and we&apos;ll create a complete website</p>
               </div>
            </div>
         </header>

         <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {!result ? (
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
                  <form onSubmit={handleGenerate} className="space-y-6">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                           Business Type
                        </label>
                        <select
                           value={storeType}
                           onChange={(e) => setStoreType(e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                           <option value="general">General Store</option>
                           <option value="fashion">Fashion & Clothing</option>
                           <option value="electronics">Electronics</option>
                           <option value="food">Food & Beverages</option>
                           <option value="books">Books & Education</option>
                           <option value="health">Health & Beauty</option>
                           <option value="home">Home & Garden</option>
                           <option value="sports">Sports & Fitness</option>
                        </select>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                           Describe Your Business
                        </label>
                        <textarea
                           value={prompt}
                           onChange={(e) => setPrompt(e.target.value)}
                           placeholder="Example: Create a vegetable store for Mumbai with organic focus, home delivery, and local farmer partnerships"
                           className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-32 resize-none"
                           required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                           Be specific about your location, target customers, and unique selling points
                        </p>
                     </div>

                     {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1">
                           <p className="text-red-700 text-sm font-medium">{error}</p>
                           <p className="text-red-600 text-xs">
                              Please check your connection and try again.
                           </p>
                        </div>
                     )}

                     <button
                        type="submit"
                        disabled={loading || !prompt.trim()}
                        className="w-full flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 touch-manipulation"
                     >
                        {loading ? (
                           <>
                              <Loader2 className="animate-spin h-5 w-5 mr-2" />
                              Generating Store...
                           </>
                        ) : (
                           <>
                              <Sparkles className="h-5 w-5 mr-2" />
                              Generate Store
                           </>
                        )}
                     </button>
                  </form>
               </div>
            ) : (
               <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
                     <div className="text-center mb-6">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Store generated</h2>
                        <p className="text-gray-600 text-sm sm:text-base">Your AI-powered site is ready to preview.</p>
                     </div>

                     <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Store details</h3>
                        <div className="space-y-2 text-sm">
                           <div><span className="font-medium text-gray-600">ID:</span> <span className="font-mono text-gray-900">{result.store_id}</span></div>
                           <div>
                              <span className="font-medium text-gray-600">Status:</span>
                              <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                                 {result.status}
                              </span>
                           </div>
                           {result.preview_url && (
                              <div>
                                 <span className="font-medium text-gray-600">Preview:</span>
                                 <a
                                    href={result.preview_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-indigo-600 hover:text-indigo-800 underline break-all"
                                 >
                                    Open preview
                                 </a>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                        <button
                           onClick={() => { setResult(null); setError(""); }}
                           className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors touch-manipulation"
                        >
                           Generate another
                        </button>
                        <button
                           onClick={handlePublish}
                           disabled={loading}
                           className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
                        >
                           {loading ? <Loader2 className="animate-spin h-5 w-5" /> : null}
                           Publish store
                        </button>
                     </div>
                  </div>
               </div>
            )}
         </main>
      </div>
   );
}