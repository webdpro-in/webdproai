"use client";

import { Check } from "lucide-react";

export default function PricingPage() {
   return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
         {/* Pricing Content */}
         <div className="max-w-7xl w-full space-y-8">
            <div className="text-center space-y-4">
               <h1 className="text-4xl font-bold text-gray-900">Upgrade Your Plan</h1>
               <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                  Get Instant Insights and take your business to the next level with our premium features.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Basic Plan */}
               <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col hover:shadow-2xl transition-shadow">
                  <div className="p-8 space-y-4">
                     <h3 className="text-xl font-semibold text-gray-900">Starter</h3>
                     <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">Free</span>
                     </div>
                     <p className="text-gray-500">Essential features for individuals.</p>
                  </div>
                  <div className="p-8 bg-gray-50 flex-1 space-y-4">
                     <ul className="space-y-3">
                        <li className="flex items-center text-gray-600">
                           <Check className="w-5 h-5 text-[#4285F4] mr-2" /> 1 Website
                        </li>
                        <li className="flex items-center text-gray-600">
                           <Check className="w-5 h-5 text-[#4285F4] mr-2" /> Basic AI Generation
                        </li>
                        <li className="flex items-center text-gray-600">
                           <Check className="w-5 h-5 text-[#4285F4] mr-2" /> Community Support
                        </li>
                     </ul>
                  </div>
                  <div className="p-8 pt-0 bg-gray-50">
                     <button className="w-full py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                        Current Plan
                     </button>
                  </div>
               </div>

               {/* Pro Plan (Highlighted) */}
               <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-[#4285F4] transform md:-translate-y-4 flex flex-col">
                  <div className="absolute top-0 inset-x-0 h-2 bg-[#4285F4]"></div>
                  <div className="p-8 space-y-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-[#4285F4]">Professional</h3>
                        <span className="bg-[#4285F4]/10 text-[#4285F4] text-xs font-bold px-3 py-1 rounded-full uppercase">Most Popular</span>
                     </div>
                     <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">$29</span>
                        <span className="ml-1 text-gray-500">/mo</span>
                     </div>
                     <p className="text-gray-500">For creators taking it seriously.</p>
                  </div>
                  <div className="p-8 bg-gray-50 flex-1 space-y-4">
                     <ul className="space-y-3">
                        <li className="flex items-center text-gray-900 font-medium">
                           <Check className="w-5 h-5 text-[#4285F4] mr-2" /> 5 Websites
                        </li>
                        <li className="flex items-center text-gray-900 font-medium">
                           <Check className="w-5 h-5 text-[#4285F4] mr-2" /> Advanced AI Generation
                        </li>
                        <li className="flex items-center text-gray-900 font-medium">
                           <Check className="w-5 h-5 text-[#4285F4] mr-2" /> Custom Domains
                        </li>
                        <li className="flex items-center text-gray-900 font-medium">
                           <Check className="w-5 h-5 text-[#4285F4] mr-2" /> Payment Integration
                        </li>
                     </ul>
                  </div>
                  <div className="p-8 pt-0 bg-gray-50">
                     <button className="w-full py-3 px-4 bg-[#4285F4] text-white rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200">
                        Start Free Analysis
                     </button>
                  </div>
               </div>

               {/* Business Plan */}
               <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col hover:shadow-2xl transition-shadow">
                  <div className="p-8 space-y-4">
                     <h3 className="text-xl font-semibold text-gray-900">Business</h3>
                     <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">$99</span>
                        <span className="ml-1 text-gray-500">/mo</span>
                     </div>
                     <p className="text-gray-500">For scaling agencies and teams.</p>
                  </div>
                  <div className="p-8 bg-gray-50 flex-1 space-y-4">
                     <ul className="space-y-3">
                        <li className="flex items-center text-gray-600">
                           <Check className="w-5 h-5 text-[#4285F4] mr-2" /> Unlimited Websites
                        </li>
                        <li className="flex items-center text-gray-600">
                           <Check className="w-5 h-5 text-[#4285F4] mr-2" /> Priority Support
                        </li>
                        <li className="flex items-center text-gray-600">
                           <Check className="w-5 h-5 text-[#4285F4] mr-2" /> Team Collaboration
                        </li>
                        <li className="flex items-center text-gray-600">
                           <Check className="w-5 h-5 text-[#4285F4] mr-2" /> API Access
                        </li>
                     </ul>
                  </div>
                  <div className="p-8 pt-0 bg-gray-50">
                     <button className="w-full py-3 px-4 bg-white border border-[#4285F4] text-[#4285F4] rounded-lg font-medium hover:bg-blue-50 transition-colors">
                        Contact Sales
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
