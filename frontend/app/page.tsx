"use client"

import { PromptBox } from "@/components/ui/PromptBox";
import { Button } from "@/components/ui/Button";
import { Globe, ShoppingBag, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
   const [isGenerating, setIsGenerating] = useState(false);
   const router = useRouter();

   const handleGenerate = (prompt: string) => {
      setIsGenerating(true);
      // Simulate processing delay content
      setTimeout(() => {
         // Encode prompt to pass to dashboard or onboarding flow
         const encodedPrompt = encodeURIComponent(prompt);
         router.push(`/login?intent=generate&prompt=${encodedPrompt}`);
      }, 1500);
   };

   return (
      <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-x-hidden">
         {/* Background Gradients */}
         <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
         </div>

         {/* Navbar */}
         <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-lg">W</span>
               </div>
               <span className="text-xl font-bold tracking-tight">WebDPro</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
               <Link href="#" className="hover:text-white transition-colors">Features</Link>
               <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
               <Link href="#" className="hover:text-white transition-colors">Showcase</Link>
            </div>
            <div className="flex items-center gap-4">
               <Link href="/login">
                  <Button variant="ghost" className="text-gray-300 hover:text-white">Login</Button>
               </Link>
               <Button variant="premium" className="hidden sm:flex" size="sm">
                  Get Started
               </Button>
            </div>
         </nav>

         <main className="relative z-10 pt-20 pb-32 px-6">
            {/* Hero Section */}
            <div className="max-w-5xl mx-auto text-center space-y-8">
               <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium animate-fade-in">
                     <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                     </span>
                     AI-Powered Business Builder
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                     Build a complete business <br />
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                        just by describing it.
                     </span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                     WebDPro isn't just a website builder. It generates a full-stack business specific to your needs—payments, inventory, and delivery included.
                  </p>
               </div>

               {/* Prompt Box */}
               <div className="pt-8 pb-12 animate-slide-up">
                  <PromptBox onSubmit={handleGenerate} isGenerating={isGenerating} />
               </div>

               {/* Feature Grid */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
                  <FeatureCard
                     icon={<Globe className="w-5 h-5 text-blue-400" />}
                     title="Instant Deployment"
                     description="From prompt to live URL in under 5 minutes. No coding required."
                     delay={100}
                  />
                  <FeatureCard
                     icon={<ShoppingBag className="w-5 h-5 text-pink-400" />}
                     title="Full Operations"
                     description="Inventory, orders, and delivery management tailored to your sector."
                     delay={200}
                  />
                  <FeatureCard
                     icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
                     title="Payments Ready"
                     description="Integrated Razorpay payments and automated settlements."
                     delay={300}
                  />
               </div>
            </div>
         </main>

         {/* Footer (Minimal) */}
         <footer className="relative z-10 border-t border-white/5 py-12 px-6">
            <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
               <p>&copy; {new Date().getFullYear()} WebDPro Inc. All rights reserved.</p>
            </div>
         </footer>
      </div>
   );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
   return (
      <div
         className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all duration-300 group"
         style={{ animationDelay: `${delay}ms` }}
      >
         <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/5">
            {icon}
         </div>
         <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
         <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
   )
}
