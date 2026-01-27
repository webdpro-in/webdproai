"use client"

import { Globe, ShoppingBag, ShieldCheck, Zap, BarChart, Smartphone } from "lucide-react";

export default function FeaturesPage() {
   return (
      <div className="min-h-screen bg-white pt-24 pb-24">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
               <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Platform Features</h1>
               <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to launch, run, and scale your business.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <FeatureCard
                  icon={<Globe className="w-8 h-8 text-indigo-600" />}
                  title="Instant Deployment"
                  description="From prompt to live URL in under 5 minutes. We handle the hosting, SSL, and scaling automatically so you can focus on selling."
               />
               <FeatureCard
                  icon={<ShoppingBag className="w-8 h-8 text-purple-600" />}
                  title="Inventory Management"
                  description="Built-in inventory system to track stock levels, variants, and categories effortlessly. Syncs across all changes."
               />
               <FeatureCard
                  icon={<ShieldCheck className="w-8 h-8 text-emerald-600" />}
                  title="Secure Payments"
                  description="Pre-integrated Razorpay gateway. Start accepting UPI, Cards, and Netbanking instantly with zero configuration."
               />
               <FeatureCard
                  icon={<Zap className="w-8 h-8 text-yellow-600" />}
                  title="AI Automation"
                  description="Automated order confirmations, invoices, and customer support chatbot included. Let AI handle the busywork."
               />
               <FeatureCard
                  icon={<BarChart className="w-8 h-8 text-blue-600" />}
                  title="Analytics Dashboard"
                  description="Real-time insights on sales, visitors, and conversion rates to help you grow intelligently. Make data-driven decisions."
               />
               <FeatureCard
                  icon={<Smartphone className="w-8 h-8 text-pink-600" />}
                  title="Mobile Optimized"
                  description="Perfect experience on every device. Your customers can shop from anywhere, anytime with our responsive designs."
               />
            </div>
         </div>
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
   )
}
