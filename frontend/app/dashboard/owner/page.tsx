"use client"

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Plus, ExternalLink, Activity, DollarSign, ShoppingCart } from "lucide-react"
import Link from "next/link"

export default function OwnerDashboard() {
   return (
      <div className="p-8 space-y-8 min-h-screen bg-black text-white">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  Business Dashboard
               </h1>
               <p className="text-gray-400 mt-1">Manage your websites and inventory</p>
            </div>
            <Link href="/dashboard/owner/create">
               <Button variant="premium" className="shadow-lg shadow-indigo-500/20">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Website
               </Button>
            </Link>
         </div>

         {/* Stats Row */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
               title="Total Revenue"
               value="₹45,231"
               trend="+12% today"
               icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
            />
            <StatsCard
               title="Active Orders"
               value="12"
               trend="4 pending delivery"
               icon={<ShoppingCart className="w-5 h-5 text-blue-400" />}
            />
            <StatsCard
               title="Site Visits"
               value="1,204"
               trend="+84 this week"
               icon={<Activity className="w-5 h-5 text-purple-400" />}
            />
         </div>

         {/* Websites List */}
         <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">My Websites</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {/* Demo Existing Site */}
               <Card className="glass-card hover:border-indigo-500/50 transition-colors group">
                  <CardHeader className="pb-3">
                     <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-4 border border-yellow-500/20">
                           ☕
                        </div>
                        <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">Live</span>
                     </div>
                     <CardTitle className="text-white">Bean & Brew Cafe</CardTitle>
                     <CardDescription>Coffee Shop • Bangalore</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-4">
                        <div className="flex justify-between text-sm text-gray-400">
                           <span>Products</span>
                           <span className="text-white">42</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400">
                           <span>Orders Today</span>
                           <span className="text-white">8</span>
                        </div>
                        <div className="pt-4 flex gap-2">
                           <Button variant="outline" className="w-full border-gray-700 hover:bg-gray-800 text-white">
                              Edit Site
                           </Button>
                           <Button variant="ghost" className="px-3" title="View Live">
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                           </Button>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Placeholder for 'Create New' if user has no sites (Visual cue) */}
               <Link href="/dashboard/owner/create">
                  <div className="h-full min-h-[250px] rounded-xl border border-dashed border-gray-800 flex flex-col items-center justify-center text-gray-500 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-white/5 transition-all cursor-pointer gap-4 group">
                     <div className="p-4 rounded-full bg-white/5 group-hover:bg-indigo-500/20 transition-colors">
                        <Plus className="w-8 h-8" />
                     </div>
                     <span className="font-medium">Create New Website</span>
                  </div>
               </Link>
            </div>
         </div>
      </div>
   )
}

function StatsCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
   return (
      <Card className="glass-card">
         <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
               <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  {icon}
               </div>
               {/* Sparkline placeholder could go here */}
            </div>
            <div className="space-y-1">
               <p className="text-sm text-gray-400">{title}</p>
               <h3 className="text-2xl font-bold text-white">{value}</h3>
               <p className="text-xs text-gray-500">{trend}</p>
            </div>
         </CardContent>
      </Card>
   )
}
