"use client"

import LoginView from "@/components/auth/LoginView";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
   return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
         <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12">
            {/* Left Side - Branding */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
               <Link 
                  href="/" 
                  className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors mb-4"
               >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Home
               </Link>
               
               <div className="space-y-4">
                  <div className="inline-flex items-center gap-3">
                     <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-200">
                        W
                     </div>
                     <h1 className="text-4xl font-bold text-gray-900">WebDPro</h1>
                  </div>
                  
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                     Build Your Online Store in Minutes
                  </h2>
                  
                  <p className="text-lg text-gray-600 max-w-md mx-auto lg:mx-0">
                     AI-powered e-commerce platform that helps you create, manage, and grow your online business.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
                     <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>No coding required</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>AI-powered design</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Instant deployment</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 w-full max-w-md">
               <LoginView />
            </div>
         </div>
      </div>
   )
}
