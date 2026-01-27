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
            prompt,
            storeType,
            language: "en",
            currency: "INR"
         });

         setResult(response.store);
         console.log("Store generated:", response.store);
      } catch (error: any) {
         setError(error.message || "Failed to generate store");
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
         router.push(`/dashboard/stores/${result.store_id}`);
      } catch (error: any) {
         setError(error.message || "Failed to publish store");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-gray-50">
         {/* Header */}
         <header className="bg-white shadow-sm">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
               <button
                  onClick={() => router.back()}
                  className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
               >
                  <ArrowLeft className="h-5 w-5" />
               </button>
               <div>
                  <h1 className="text-2xl font-bold text-gray-900">Generate AI Store</h1>
                  <p className="text-sm text-gray-600">Describe your business and we'll create a complete website</p>
               </div>
            </div>
         </header>

         <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {!result ? (
               <div className="bg-white rounded-lg shadow p-8">
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
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                           <p className="text-red-600 text-sm">{error}</p>
                        </div>
                     )}

                     <button
                        type="submit"
                        disabled={loading || !prompt.trim()}
                        className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                  <div className="bg-white rounded-lg shadow p-8">
                     <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Sparkles className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Store Generated Successfully!</h2>
                        <p className="text-gray-600">Your AI-powered website is ready for preview</p>
                     </div>

                     <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Store Details</h3>
                        <div className="space-y-2 text-sm">
                           <div><span className="font-medium">Store ID:</span> {result.store_id}</div>
                           <div><span className="font-medium">Status:</span> 
                              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                 {result.status}
                              </span>
                           </div>
                           {result.preview_url && (
                              <div>
                                 <span className="font-medium">Preview URL:</span>
                                 <a 
                                    href={result.preview_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                                 >
                                    View Preview
                                 </a>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="flex space-x-4">
                        <button
                           onClick={() => setResult(null)}
                           className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                        >
                           Generate Another
                        </button>
                        <button
                           onClick={handlePublish}
                           disabled={loading}
                           className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 flex items-center justify-center"
                        >
                           {loading ? (
                              <Loader2 className="animate-spin h-5 w-5 mr-2" />
                           ) : null}
                           Publish Store
                        </button>
                     </div>
                  </div>
               </div>
            )}
         </main>
      </div>
   );
}