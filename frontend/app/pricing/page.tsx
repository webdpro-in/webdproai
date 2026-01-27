"use client"

import { Button } from "@/components/ui/Button";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

// Pricing Configuration
const pricingData = {
   IN: {
      label: "India",
      flag: "🇮🇳",
      currency: "₹",
      plans: {
         basic: "999",
         pro: "4,999",
         enterprise: "14,999"
      }
   },
   US: {
      label: "USA & Canada",
      flag: "🇺🇸",
      currency: "$",
      plans: {
         basic: "49",
         pro: "199",
         enterprise: "499"
      }
   },
   EU: {
      label: "UK & Europe",
      flag: "🇪🇺",
      currency: "€",
      plans: {
         basic: "39",
         pro: "179",
         enterprise: "449"
      }
   },
   AE: {
      label: "Middle East",
      flag: "🇦🇪",
      currency: "AED ",
      plans: {
         basic: "149",
         pro: "749",
         enterprise: "1,999"
      }
   },
   SEA: {
      label: "Southeast Asia",
      flag: "🌏",
      currency: "$",
      plans: {
         basic: "29",
         pro: "99",
         enterprise: "299"
      }
   },
   AF: {
      label: "Africa & Emerging",
      flag: "🌍",
      currency: "$",
      plans: {
         basic: "19",
         pro: "79",
         enterprise: "249"
      }
   }
} as const;

type RegionCode = keyof typeof pricingData;

export default function PricingPage() {
   const [region, setRegion] = useState<RegionCode>("IN");
   const currentPricing = pricingData[region];

   return (
      <div className="min-h-screen bg-white pt-24 pb-24">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12 space-y-4">
               <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
               <p className="text-xl text-gray-600 max-w-2xl mx-auto">Choose the plan that fits your business scale relative to your region.</p>

               {/* Pricing Region Selector */}
               <div className="flex justify-center mt-8">
                  <div className="relative inline-block text-left group z-20">
                     <button className="flex items-center gap-3 px-5 py-3 rounded-full bg-white border-2 border-indigo-100 hover:border-indigo-300 text-gray-700 transition-all shadow-sm">
                        <span className="text-2xl">{currentPricing.flag}</span>
                        <span className="font-semibold text-lg">{currentPricing.label}</span>
                        <span className="text-gray-400">({currentPricing.currency})</span>
                        <ChevronDown className="w-5 h-5 text-indigo-500 group-hover:rotate-180 transition-transform ml-2" />
                     </button>
                     <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top p-2 grid grid-cols-1 gap-1">
                        {Object.entries(pricingData).map(([key, data]) => (
                           <button
                              key={key}
                              onClick={() => setRegion(key as RegionCode)}
                              className={`w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 flex items-center justify-between transition-colors ${region === key ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-gray-600'}`}
                           >
                              <div className="flex items-center gap-3">
                                 <span className="text-xl">{data.flag}</span>
                                 <span className="font-medium">{data.label}</span>
                              </div>
                              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{data.currency}</span>
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
               {/* Basic Plan */}
               <div className="rounded-3xl p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all flex flex-col">
                  <div className="flex-1">
                     <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        BASIC
                     </h3>
                     <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                           {currentPricing.currency}{currentPricing.plans.basic}
                        </span>
                        <span className="text-gray-500 font-medium">/month</span>
                     </div>
                     <p className="mt-4 text-sm text-gray-500">Perfect for small local businesses.</p>
                     <ul className="mt-8 space-y-4">
                        {["1 Store Generated", "Basic Inventory", "Online Payments", "Standard Support"].map(feat => (
                           <li key={feat} className="flex items-start gap-3 text-sm text-gray-600">
                              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                              {feat}
                           </li>
                        ))}
                     </ul>
                  </div>
                  <Button variant="outline" className="w-full mt-8 border-gray-200 hover:bg-gray-50 text-gray-900 font-semibold">Get Started</Button>
               </div>

               {/* AI Inventory Plan (Featured) */}
               <div className="relative rounded-3xl p-8 bg-gray-900 border border-gray-900 text-white shadow-2xl scale-105 transform z-10 flex flex-col">
                  <div className="absolute top-0 right-0 -mr-px -mt-px bg-indigo-500 text-white text-[10px] tracking-wider font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase">Most Popular</div>
                  <div className="flex-1">
                     <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                        AI INVENTORY
                     </h3>
                     <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-5xl font-extrabold text-white tracking-tight">
                           {currentPricing.currency}{currentPricing.plans.pro}
                        </span>
                        <span className="text-gray-400 font-medium">/month</span>
                     </div>
                     <p className="mt-4 text-sm text-gray-400">For growing businesses needing automation.</p>
                     <ul className="mt-8 space-y-4">
                        {["3 Stores Generated", "AI Auto-Inventory", "Priority Support", "AI Assistant", "Custom Domain"].map(feat => (
                           <li key={feat} className="flex items-start gap-3 text-sm text-gray-300">
                              <Check className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                              {feat}
                           </li>
                        ))}
                     </ul>
                  </div>
                  <Button variant="premium" className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 border-none text-white shadow-indigo-500/50 shadow-lg font-semibold h-12">Get Started Now</Button>
               </div>

               {/* Enterprise Plan */}
               <div className="rounded-3xl p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all flex flex-col">
                  <div className="flex-1">
                     <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                        ENTERPRISE
                     </h3>
                     <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-sm text-gray-500 font-medium">from</span>
                        <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                           {currentPricing.currency}{currentPricing.plans.enterprise}
                        </span>
                        <span className="text-gray-500 font-medium">/month</span>
                     </div>
                     <p className="mt-4 text-sm text-gray-500">For large scale operations.</p>
                     <ul className="mt-8 space-y-4">
                        {["Unlimited Stores", "API Access", "Dedicated Success Manager", "White Labelling", "24/7 Phone Support"].map(feat => (
                           <li key={feat} className="flex items-start gap-3 text-sm text-gray-600">
                              <Check className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                              {feat}
                           </li>
                        ))}
                     </ul>
                  </div>
                  <Button variant="outline" className="w-full mt-8 border-gray-200 hover:bg-gray-50 text-gray-900 font-semibold">Contact Sales</Button>
               </div>
            </div>
         </div>
      </div>
   );
}
