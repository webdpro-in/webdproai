"use client"

import { PromptBox } from "@/components/ui/PromptBox";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, ShoppingBag, ShieldCheck, Zap, BarChart, Smartphone } from "lucide-react";

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

            {/* Marquee Section */}
            <div className="py-20 bg-white border-y border-gray-100 overflow-hidden">
               <div className="marquee">
                  {/* Line 1 */}
                  <div className="marquee__row">
                     <div className="marquee__inner" aria-hidden="true">
                        <span>AI Website Generation</span>
                        <span>Cloud-Ready Architecture</span>
                        <span>SEO Optimized by Default</span>
                        <span>AI Website Generation</span>
                        <span>Cloud-Ready Architecture</span>
                        <span>SEO Optimized by Default</span>
                     </div>
                  </div>

                  {/* Line 2 */}
                  <div className="marquee__row reverse">
                     <div className="marquee__inner" aria-hidden="true">
                        <span>Custom Domain & HTTPS</span>
                        <span>Lightning-Fast Hosting</span>
                        <span>Secure Payments</span>
                        <span>Custom Domain & HTTPS</span>
                        <span>Lightning-Fast Hosting</span>
                        <span>Secure Payments</span>
                     </div>
                  </div>

                  {/* Line 3 */}
                  <div className="marquee__row">
                     <div className="marquee__inner" aria-hidden="true">
                        <span>Scalable for 10+ Years</span>
                        <span>Modern UI / UX</span>
                        <span>Enterprise-Grade Security</span>
                        <span>Scalable for 10+ Years</span>
                        <span>Modern UI / UX</span>
                        <span>Enterprise-Grade Security</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Features Section (Static) */}
            <section className="py-24 bg-white">
               <div className="max-w-7xl mx-auto px-6">
                  <div className="text-center mb-16 space-y-4">
                     <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Platform Features</h2>
                     <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to launch, run, and scale your business.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     <FeatureCard
                        icon={<Globe className="w-8 h-8 text-indigo-600" />}
                        title="Instant Deployment"
                        description="From prompt to live URL in under 5 minutes. We handle the hosting, SSL, and scaling automatically."
                     />
                     <FeatureCard
                        icon={<ShoppingBag className="w-8 h-8 text-purple-600" />}
                        title="Inventory Management"
                        description="Built-in inventory system to track stock levels, variants, and categories effortlessly."
                     />
                     <FeatureCard
                        icon={<ShieldCheck className="w-8 h-8 text-emerald-600" />}
                        title="Secure Payments"
                        description="Pre-integrated Razorpay gateway. Start accepting UPI, Cards, and Netbanking instantly."
                     />
                     <FeatureCard
                        icon={<Zap className="w-8 h-8 text-yellow-600" />}
                        title="AI Automation"
                        description="Automated order confirmations, invoices, and customer support chatbot included."
                     />
                     <FeatureCard
                        icon={<BarChart className="w-8 h-8 text-blue-600" />}
                        title="Analytics Dashboard"
                        description="Real-time insights on sales, visitors, and conversion rates to help you grow intelligently."
                     />
                     <FeatureCard
                        icon={<Smartphone className="w-8 h-8 text-pink-600" />}
                        title="Mobile Optimized"
                        description="Perfect experience on every device. Your customers can shop from anywhere, anytime."
                     />
                  </div>
               </div>
            </section>
         </main>

         {/* Footer */}
         <footer className="w-full border-t border-gray-100 py-8 px-6 bg-gray-50">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
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

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
   return (
      <div className="p-8 rounded-3xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 group">
         <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            {icon}
         </div>
         <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
         <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
   );
}
