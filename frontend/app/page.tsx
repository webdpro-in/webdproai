"use client"

import { PromptBox } from "@/components/ui/PromptBox";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
   const [isGenerating, setIsGenerating] = useState(false);
   const router = useRouter();

   const handleGenerate = (prompt: string) => {
      setIsGenerating(true);
      setTimeout(() => {
         const encodedPrompt = encodeURIComponent(prompt);
         router.push(`/login?intent=generate&prompt=${encodedPrompt}`);
      }, 1500);
   };

   return (
      <div className="min-h-screen bg-white text-gray-900 selection:bg-indigo-100 overflow-x-hidden">
         <main className="pt-24 pb-32">
            {/* Hero Section */}
            <section className="relative px-6 py-20 lg:py-32">
               {/* Decorative blobs */}
               <div className="absolute top-0 right-0 -z-10 opacity-30 pointer-events-none">
                  <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-purple-200/50 rounded-full blur-[100px]" />
                  <div className="absolute top-40 right-[400px] w-[300px] h-[300px] bg-indigo-200/50 rounded-full blur-[80px]" />
               </div>

               <div className="max-w-5xl mx-auto text-center space-y-8">
                  <div className="space-y-6">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium animate-fade-in shadow-sm">
                        <span className="relative flex h-2 w-2">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        AI-Powered Business Builder
                     </div>
                     <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                        Build a complete business <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                           just by describing it.
                        </span>
                     </h1>
                     <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        WebDPro isn&apos;t just a website builder. It generates a full-stack business specific to your needs—payments, inventory, and delivery included.
                     </p>
                  </div>

                  {/* Prompt Box */}
                  <div className="pt-8 pb-12 animate-slide-up">
                     <PromptBox onSubmit={handleGenerate} isGenerating={isGenerating} />
                  </div>
               </div>
            </section>
         </main>

         {/* Footer */}
         <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-100 py-6 px-6 bg-white/50 backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-400">
               <div>
                  &copy; {new Date().getFullYear()} WebDPro Solutions Pvt. Ltd.
               </div>
               <div className="flex gap-6">
                  <a href="#" className="hover:text-indigo-600 transition-colors">Twitter</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">LinkedIn</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
               </div>
            </div>
         </footer>
      </div>
   );
}
