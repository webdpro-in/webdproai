"use client"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ArrowLeft, Edit3, Save, Globe, Smartphone, Monitor, Settings, Calendar, ShoppingBag } from "lucide-react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type BusinessType = "RETAIL" | "CLINIC" | "RESTAURANT"

export default function WebsiteEditor() {
   const router = useRouter()
   const searchParams = useSearchParams()

   // Parse AI Config if available
   const aiConfigStr = searchParams.get("config")
   const aiConfig = aiConfigStr ? JSON.parse(decodeURIComponent(aiConfigStr)) : null

   const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")
   const [businessType, setBusinessType] = useState<BusinessType>("RETAIL") // Mock switch for demo (can be derived from AI config later)
   const [isDomainModalOpen, setIsDomainModalOpen] = useState(false)

   // State for editable content (initialized with AI data or defaults)
   const [bizName, setBizName] = useState(aiConfig?.name || "Bean & Brew Cafe")
   const [tagline, setTagline] = useState(aiConfig?.tagline || "Fresh Coffee in Bangalore")
   const [themeColor, setThemeColor] = useState(aiConfig?.themeColor || "#6366f1") // Default Indigo

   return (
      <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
         {/* Top Bar */}
         <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-black/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
               <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/owner")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Exit
               </Button>
               <div className="h-6 w-px bg-gray-800" />
               <span className="font-semibold text-sm">Draft Editor</span>
            </div>

            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
               <button
                  onClick={() => setViewMode("desktop")}
                  className={`p-2 rounded-md transition-all ${viewMode === "desktop" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-white"}`}
               >
                  <Monitor className="w-4 h-4" />
               </button>
               <button
                  onClick={() => setViewMode("mobile")}
                  className={`p-2 rounded-md transition-all ${viewMode === "mobile" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-white"}`}
               >
                  <Smartphone className="w-4 h-4" />
               </button>
            </div>

            <div className="flex items-center gap-3">
               {/* Business Type Toggle for Demo */}
               <div className="flex bg-gray-800 rounded-md mr-4">
                  <button onClick={() => setBusinessType("RETAIL")} className={`px-3 py-1 text-xs rounded-md ${businessType === "RETAIL" ? "bg-indigo-600" : ""}`}>Retail</button>
                  <button onClick={() => setBusinessType("CLINIC")} className={`px-3 py-1 text-xs rounded-md ${businessType === "CLINIC" ? "bg-indigo-600" : ""}`}>Clinic</button>
               </div>

               <Button variant="ghost" size="sm" className="text-gray-400">Discard</Button>
               <Button variant="premium" size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Publish Changes
               </Button>
            </div>
         </header>

         <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Controls */}
            <aside className="w-72 border-r border-gray-800 bg-black/20 overflow-y-auto p-4 space-y-8">
               {/* Domains Section */}
               <div className="p-4 bg-gray-800/20 border border-gray-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-medium">
                     <Globe className="w-4 h-4" />
                     <span>Domain Settings</span>
                  </div>
                  <div className="space-y-2">
                     <div className="p-2 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400 flex justify-between items-center">
                        <span>demo.webdpro.in</span>
                        <span className="font-bold">Active</span>
                     </div>
                     <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 border-gray-700 hover:bg-gray-700"
                        onClick={() => setIsDomainModalOpen(!isDomainModalOpen)}
                     >
                        Connect Custom Domain
                     </Button>
                     {isDomainModalOpen && (
                        <div className="animate-fade-in space-y-2 pt-2 border-t border-gray-700 mt-2">
                           <Input placeholder="example.com" className="h-8 text-xs bg-gray-900 border-gray-700" />
                           <p className="text-[10px] text-gray-500">Update DNS A-Record to 76.23.11.90</p>
                           <Button size="sm" className="w-full h-7 text-xs bg-indigo-600">Verify & Connect</Button>
                        </div>
                     )}
                  </div>
               </div>

               <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Content</h3>
                  <div className="space-y-3">
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Business Name</label>
                        <Input defaultValue={businessType === "RETAIL" ? "Bean & Brew Cafe" : "City Dental Clinic"} className="h-9 bg-gray-900/50 border-gray-700" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Tagline</label>
                        <Input defaultValue={businessType === "RETAIL" ? "Fresh Coffee in Bangalore" : "Expert Care for Beautiful Smiles"} className="h-9 bg-gray-900/50 border-gray-700" />
                     </div>
                  </div>
               </div>

               <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Theme</h3>
                  <div className="grid grid-cols-3 gap-2">
                     {['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444'].map(color => (
                        <div key={color} className="h-8 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-gray-900 ring-transparent hover:ring-white/20 transition-all" style={{ backgroundColor: color }} />
                     ))}
                  </div>
               </div>
            </aside>

            {/* Preview Area */}
            <main className="flex-1 bg-gray-950 flex items-center justify-center p-8 relative">
               <div className={`transition-all duration-500 ease-in-out bg-white rounded-lg overflow-hidden shadow-2xl relative ${viewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full max-w-5xl'}`}>
                  {/* Mock Website Preview */}
                  <div className="h-full flex flex-col text-gray-900 relative">
                     {/* Mock Nav */}
                     <nav className="h-14 border-b flex items-center justify-between px-6 bg-white shrink-0">
                        <span className="font-bold text-lg text-amber-700">
                           {businessType === "RETAIL" ? "Bean & Brew" : "City Dental"}
                        </span>
                        <div className="flex gap-4 text-sm font-medium text-gray-600">
                           {businessType === "RETAIL" ? (
                              <>
                                 <span>Menu</span>
                                 <span>Cart (0)</span>
                              </>
                           ) : (
                              <>
                                 <span>Services</span>
                                 <span>My Appointments</span>
                              </>
                           )}
                        </div>
                     </nav>

                     {/* Mock Hero */}
                     <div className="flex-1 overflow-y-auto">
                        {businessType === "RETAIL" ? (
                           <>
                              <div className="h-64 bg-amber-50 flex items-center justify-center text-center p-8">
                                 <div>
                                    <span className="text-amber-600 font-medium text-sm tracking-wide uppercase">New Arrival</span>
                                    <h1 className="text-4xl font-bold mt-2 mb-4 text-gray-900">Artisan Coffee</h1>
                                    <button className="px-6 py-2 bg-amber-700 text-white rounded-full text-sm font-medium">Order Now</button>
                                 </div>
                              </div>
                              <div className="p-8 grid grid-cols-2 gap-4">
                                 {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
                                 ))}
                              </div>
                           </>
                        ) : (
                           <>
                              <div className="h-64 bg-blue-50 flex items-center justify-center text-center p-8">
                                 <div>
                                    <span className="text-blue-600 font-medium text-sm tracking-wide uppercase">Book Online</span>
                                    <h1 className="text-4xl font-bold mt-2 mb-4 text-gray-900">Professional Dental Care</h1>
                                    <button className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-medium flex items-center gap-2 mx-auto">
                                       <Calendar className="w-4 h-4" />
                                       Book Appointment
                                    </button>
                                 </div>
                              </div>
                              <div className="p-8 space-y-4">
                                 {[1, 2, 3].map(i => (
                                    <div key={i} className="p-4 border rounded-xl flex items-center justify-between hover:border-blue-500 cursor-pointer">
                                       <div>
                                          <h4 className="font-semibold">General Checkup</h4>
                                          <p className="text-sm text-gray-500">30 mins • Dr. Smith</p>
                                       </div>
                                       <span className="text-blue-600 font-medium">Book</span>
                                    </div>
                                 ))}
                              </div>
                           </>
                        )}
                     </div>

                     {/* Floating AI Assistant for Contextual Editing */}
                     <div className="absolute bottom-6 right-6">
                        <button className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 hover:scale-105 transition-all">
                           <SparklesIcon className="w-5 h-5" />
                           <span className="font-medium">AI Helper</span>
                        </button>
                     </div>
                  </div>
               </div>
            </main>
         </div>
      </div>
   )
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
   return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
         <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z" />
      </svg>
   )
}
