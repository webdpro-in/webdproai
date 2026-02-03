"use client"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ArrowLeft, Save, Globe, Smartphone, Monitor, ShoppingBag, Menu, X } from "lucide-react"
import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function WebsiteEditor() {
   const router = useRouter()
   const searchParams = useSearchParams()
   const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")
   const [isDomainModalOpen, setIsDomainModalOpen] = useState(false)
   const [sidebarOpen, setSidebarOpen] = useState(true)

   // Helper function to detect if text is a raw prompt
   const isRawPrompt = (text: string | undefined | null): boolean => {
      if (!text || typeof text !== 'string') return false
      
      const promptMarkers = [
         'Business:',
         'Style:',
         'Target audience:',
         'Description:',
         'Theme:',
         'Location:',
         'Products:',
         'Services:',
         'We sell',
         'Our target audience',
         'e.g.,',
         'for young adults',
         'sustainable',
      ]
      
      // Check if text contains multiple prompt markers (likely a raw prompt)
      const markerCount = promptMarkers.filter(marker => 
         text.includes(marker)
      ).length
      
      // If 2+ markers found, it's likely a raw prompt
      if (markerCount >= 2) return true
      
      // Also check if text starts with a prompt marker
      return promptMarkers.some(marker => text.trim().startsWith(marker))
   }

   // Parse AI Config ONCE using useMemo to prevent infinite loops
   const aiConfig = useMemo(() => {
      const configStr = searchParams.get("config")
      if (!configStr) return null
      
      try {
         const parsed = JSON.parse(decodeURIComponent(configStr))
         console.log('[Editor] AI Config loaded:', {
            hasSections: !!parsed?.sections,
            sectionCount: parsed?.sections?.length || 0,
            businessName: parsed?.name || parsed?.businessName,
            businessType: parsed?.businessType || parsed?.storeType
         })
         return parsed
      } catch (error) {
         console.error('[Editor] Failed to parse AI config:', error)
         return null
      }
   }, [searchParams])

   // Extract business info from AI config - memoized to prevent recalculation
   const businessInfo = useMemo(() => {
      if (!aiConfig) return {
         name: "My Business",
         type: "general",
         tagline: "",
         themeColor: "#6366f1",
         sections: []
      }

      return {
         name: aiConfig.name || aiConfig.businessName || "My Business",
         type: aiConfig.businessType || aiConfig.storeType || "general",
         tagline: aiConfig.tagline || "",
         themeColor: aiConfig.themeColor || aiConfig.primaryColor || "#6366f1",
         sections: Array.isArray(aiConfig.sections) ? aiConfig.sections : []
      }
   }, [aiConfig])

   // Quality validation - check if AI content meets minimum standards
   const contentQuality = useMemo(() => {
      const sections = businessInfo.sections
      const sectionCount = sections.length
      
      // Count sections with meaningful content (not just raw prompts)
      const meaningfulSections = sections.filter((section: any) => {
         if (!section.title && !section.content) return false
         if (section.title && isRawPrompt(section.title)) return false
         
         // Check if section has actual content
         const hasText = section.content?.text && !isRawPrompt(section.content.text)
         const hasDescription = section.content?.description && !isRawPrompt(section.content.description)
         const hasProducts = section.content?.products && Array.isArray(section.content.products) && section.content.products.length > 0
         const hasFeatures = section.content?.features && Array.isArray(section.content.features) && section.content.features.length > 0
         const hasItems = section.content?.items && Array.isArray(section.content.items) && section.content.items.length > 0
         
         return hasText || hasDescription || hasProducts || hasFeatures || hasItems
      }).length
      
      const quality = {
         totalSections: sectionCount,
         meaningfulSections,
         meetsMinimum: meaningfulSections >= 7,
         hasBusinessName: businessInfo.name !== "My Business",
         hasBusinessType: businessInfo.type !== "general",
         quality: meaningfulSections >= 7 ? 'good' : meaningfulSections >= 5 ? 'fair' : 'poor'
      }
      
      // Log quality metrics
      console.log('[Editor] Content Quality:', quality)
      
      return quality
   }, [businessInfo, isRawPrompt])

   // State for editable content
   const [bizName, setBizName] = useState(businessInfo.name)
   const [bizTagline, setBizTagline] = useState(businessInfo.tagline)
   const [currentThemeColor, setCurrentThemeColor] = useState(businessInfo.themeColor)

   return (
      <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
         {/* Top Bar - Clean, no overlapping navs */}
         <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-black/50 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-4">
               <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-800 rounded-md transition-colors lg:hidden"
               >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
               </button>
               <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/owner")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Exit Editor
               </Button>
               <div className="h-6 w-px bg-gray-800" />
               <span className="font-semibold text-sm">{bizName} - Draft</span>
            </div>

            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
               <button
                  onClick={() => setViewMode("desktop")}
                  className={`p-2 rounded-md transition-all ${viewMode === "desktop" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-white"}`}
                  title="Desktop view"
               >
                  <Monitor className="w-4 h-4" />
               </button>
               <button
                  onClick={() => setViewMode("mobile")}
                  className={`p-2 rounded-md transition-all ${viewMode === "mobile" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-white"}`}
                  title="Mobile view"
               >
                  <Smartphone className="w-4 h-4" />
               </button>
            </div>

            <div className="flex items-center gap-3">
               <Button variant="ghost" size="sm" className="text-gray-400">Discard</Button>
               <Button variant="premium" size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Publish
               </Button>
            </div>
         </header>

         <div className="flex-1 flex overflow-hidden">
            {/* Collapsible Sidebar */}
            <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 border-r border-gray-800 bg-black/20 overflow-y-auto shrink-0`}>
               <div className={`${sidebarOpen ? 'p-4' : 'hidden'} space-y-8`}>
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
                        <Input 
                           value={bizName} 
                           onChange={(e) => setBizName(e.target.value)}
                           className="h-9 bg-gray-900/50 border-gray-700" 
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Tagline</label>
                        <Input 
                           value={bizTagline} 
                           onChange={(e) => setBizTagline(e.target.value)}
                           className="h-9 bg-gray-900/50 border-gray-700" 
                           placeholder="Optional tagline"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">Business Type</label>
                        <Input 
                           value={businessInfo.type} 
                           disabled
                           className="h-9 bg-gray-900/50 border-gray-700 text-gray-500" 
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">AI Sections</label>
                        <div className="text-xs bg-gray-900/50 border border-gray-700 rounded px-3 py-2">
                           <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-300 font-medium">
                                 {contentQuality.meaningfulSections} meaningful sections
                              </span>
                              <span className={`text-xs font-bold ${
                                 contentQuality.quality === 'good' ? 'text-green-400' :
                                 contentQuality.quality === 'fair' ? 'text-yellow-400' :
                                 'text-red-400'
                              }`}>
                                 {contentQuality.quality === 'good' ? '✓ Good' :
                                  contentQuality.quality === 'fair' ? '⚠ Fair' :
                                  '✗ Poor'}
                              </span>
                           </div>
                           {!contentQuality.meetsMinimum && (
                              <p className="text-[10px] text-yellow-400 mt-1">
                                 Minimum 7 sections recommended
                              </p>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
               </div>
            </aside>

            {/* Preview Area */}
            <main className="flex-1 bg-gray-950 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
               <div className={`transition-all duration-500 ease-in-out bg-white rounded-lg overflow-hidden shadow-2xl relative ${viewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full max-w-5xl'}`}>
                  {/* AI-Generated Website Preview */}
                  <div className="h-full flex flex-col text-gray-900 relative">
                     {/* Navigation */}
                     <nav className="h-14 border-b flex items-center justify-between px-6 bg-white shrink-0" style={{ borderColor: currentThemeColor + '20' }}>
                        <span className="font-bold text-lg" style={{ color: currentThemeColor }}>
                           {bizName}
                        </span>
                        <div className="flex gap-4 text-sm font-medium text-gray-600">
                           <span>Home</span>
                           <span>About</span>
                           <span>Contact</span>
                        </div>
                     </nav>

                     {/* Content Sections - ONLY AI-generated, NO fallback templates */}
                     <div className="flex-1 overflow-y-auto">
                        {/* Quality Warning Banner */}
                        {businessInfo.sections.length > 0 && !contentQuality.meetsMinimum && (
                           <div className="bg-yellow-50 border-b border-yellow-200 p-4">
                              <div className="flex items-start gap-3">
                                 <span className="text-yellow-600 text-xl">⚠</span>
                                 <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                                       Content Quality Notice
                                    </h4>
                                    <p className="text-xs text-yellow-700">
                                       This website has {contentQuality.meaningfulSections} meaningful sections. 
                                       For best results, regenerate with more detailed business description to get 7+ sections.
                                    </p>
                                 </div>
                              </div>
                           </div>
                        )}

                        {businessInfo.sections.length > 0 ? (
                           businessInfo.sections.map((section: any, index: number) => {
                              // Skip sections that only contain the raw prompt
                              if (!section.title && !section.content) return null
                              
                              return (
                                 <div 
                                    key={index} 
                                    className="p-6 md:p-8 border-b last:border-b-0"
                                    style={{ 
                                       backgroundColor: index % 2 === 0 ? '#ffffff' : currentThemeColor + '08'
                                    }}
                                 >
                                    {/* Section Title */}
                                    {section.title && !isRawPrompt(section.title) && (
                                       <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: currentThemeColor }}>
                                          {section.title}
                                       </h2>
                                    )}
                                    
                                    {/* Section Content - structured fields only, NO raw prompt */}
                                    {section.content && typeof section.content === 'object' && (
                                       <div className="space-y-4">
                                          {/* Heading */}
                                          {section.content.heading && 
                                           !isRawPrompt(section.content.heading) && (
                                             <h3 className="text-xl font-semibold text-gray-800">
                                                {section.content.heading}
                                             </h3>
                                          )}
                                          
                                          {/* Text Content - only if it's NOT the raw prompt */}
                                          {section.content.text && 
                                           typeof section.content.text === 'string' && 
                                           !isRawPrompt(section.content.text) && (
                                             <p className="text-gray-700 leading-relaxed">
                                                {section.content.text}
                                             </p>
                                          )}
                                          
                                          {/* Description */}
                                          {section.content.description && 
                                           typeof section.content.description === 'string' &&
                                           !isRawPrompt(section.content.description) && (
                                             <p className="text-gray-600">
                                                {section.content.description}
                                             </p>
                                          )}
                                          
                                          {/* Subtitle */}
                                          {section.content.subtitle && 
                                           !isRawPrompt(section.content.subtitle) && (
                                             <p className="text-lg text-gray-600 italic">
                                                {section.content.subtitle}
                                             </p>
                                          )}
                                          
                                          {/* Products Grid */}
                                          {section.content.products && Array.isArray(section.content.products) && section.content.products.length > 0 && (
                                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                                                {section.content.products.slice(0, 8).map((product: any, pIndex: number) => (
                                                   <div key={pIndex} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                                         {product.image ? (
                                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                                                         ) : (
                                                            <ShoppingBag className="w-8 h-8 text-gray-400" />
                                                         )}
                                                      </div>
                                                      <h4 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h4>
                                                      {product.price && (
                                                         <p className="text-sm font-bold" style={{ color: currentThemeColor }}>
                                                            ₹{product.price}
                                                         </p>
                                                      )}
                                                   </div>
                                                ))}
                                             </div>
                                          )}
                                          
                                          {/* Features List */}
                                          {section.content.features && Array.isArray(section.content.features) && section.content.features.length > 0 && (
                                             <ul className="space-y-2 mt-4">
                                                {section.content.features.map((feature: string, fIndex: number) => (
                                                   <li key={fIndex} className="flex items-start gap-2">
                                                      <span className="text-green-500 mt-1 shrink-0">✓</span>
                                                      <span className="text-gray-700">{feature}</span>
                                                   </li>
                                                ))}
                                             </ul>
                                          )}
                                          
                                          {/* Items List */}
                                          {section.content.items && Array.isArray(section.content.items) && section.content.items.length > 0 && (
                                             <div className="space-y-3 mt-4">
                                                {section.content.items.map((item: any, iIndex: number) => (
                                                   <div key={iIndex} className="p-4 border rounded-lg bg-white">
                                                      {item.title && <h4 className="font-semibold mb-1">{item.title}</h4>}
                                                      {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                                                      {item.name && <p className="font-medium">{item.name}</p>}
                                                   </div>
                                                ))}
                                             </div>
                                          )}
                                          
                                          {/* CTA Button */}
                                          {section.content.cta && (
                                             <button 
                                                className="mt-4 px-6 py-2 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
                                                style={{ backgroundColor: currentThemeColor }}
                                             >
                                                {section.content.cta}
                                             </button>
                                          )}
                                       </div>
                                    )}
                                 </div>
                              )
                           })
                        ) : (
                           <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                              <div className="max-w-md">
                                 <p className="text-lg font-semibold mb-2">No AI Content Available</p>
                                 <p className="text-sm mb-4">The AI-generated configuration could not be loaded.</p>
                                 <p className="text-xs text-gray-400">
                                    Config status: {aiConfig ? 'Loaded but no sections' : 'Not found'}
                                 </p>
                                 <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-4"
                                    onClick={() => router.push("/dashboard/sites/new")}
                                 >
                                    Generate New Website
                                 </Button>
                              </div>
                           </div>
                        )}
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
