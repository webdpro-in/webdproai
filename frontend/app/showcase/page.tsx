"use client"

export default function ShowcasePage() {
   return (
      <div className="min-h-screen bg-white pt-24 pb-24">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
               <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Made with WebDPro</h1>
               <p className="text-xl text-gray-600 max-w-2xl mx-auto">See what others have built in minutes. Real businesses running on AI.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {/* Showcase Item 1 */}
               <div className="group rounded-3xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer">
                  <div className="h-72 bg-gray-100 relative group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                     <span className="text-gray-400 font-medium">Preview Image</span>
                  </div>
                  <div className="p-8 bg-white relative z-10">
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <h3 className="font-bold text-xl text-gray-900">Urban Coffee Roasters</h3>
                           <p className="text-sm text-gray-500">Coffee Shop & Subscription</p>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">LIVE</span>
                     </div>
                     <p className="mt-4 text-gray-600 text-sm">Generated in 3 mins. Includes subscription payments and bean inventory.</p>
                  </div>
               </div>
               {/* Showcase Item 2 */}
               <div className="group rounded-3xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer">
                  <div className="h-72 bg-gray-100 relative group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                     <span className="text-gray-400 font-medium">Preview Image</span>
                  </div>
                  <div className="p-8 bg-white relative z-10">
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <h3 className="font-bold text-xl text-gray-900">Neon Fashion</h3>
                           <p className="text-sm text-gray-500">Apparel E-commerce</p>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">LIVE</span>
                     </div>
                     <p className="mt-4 text-gray-600 text-sm">Generated in 4 mins. Features size variant tracking and Instagram integration.</p>
                  </div>
               </div>
               {/* Showcase Item 3 */}
               <div className="group rounded-3xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer">
                  <div className="h-72 bg-gray-100 relative group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                     <span className="text-gray-400 font-medium">Preview Image</span>
                  </div>
                  <div className="p-8 bg-white relative z-10">
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <h3 className="font-bold text-xl text-gray-900">Fresh Greens</h3>
                           <p className="text-sm text-gray-500">Organic Vegetable Delivery</p>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">LIVE</span>
                     </div>
                     <p className="mt-4 text-gray-600 text-sm">Generated in 2 mins. Local delivery radius setup and recurring delivery orders.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
