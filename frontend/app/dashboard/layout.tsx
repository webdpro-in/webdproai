"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
   LayoutDashboard,
   Store,
   ShoppingBag,
   Package,
   Settings,
   LogOut,
   Menu,
   X
} from "lucide-react";

export default function DashboardLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   const router = useRouter();
   const pathname = usePathname();
   const [isSidebarOpen, setSidebarOpen] = useState(true);

   useEffect(() => {
      // Basic Auth Check
      const token = localStorage.getItem("token");
      if (!token) {
         router.push("/login");
      }
   }, [router]);

   const navItems = [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Websites", href: "/dashboard/sites", icon: Store },
      { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
      { label: "Inventory", href: "/dashboard/inventory", icon: Package },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
   ];

   const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      router.push("/login");
   };

   return (
      <div className="min-h-screen bg-gray-50 flex">
         {/* Sidebar */}
         <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
               } lg:relative lg:translate-x-0`}
         >
            <div className="h-full flex flex-col">
               <div className="h-16 flex items-center px-6 border-b border-gray-100">
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                     WebDPro AI
                  </span>
                  <button
                     className="ml-auto lg:hidden"
                     onClick={() => setSidebarOpen(false)}
                  >
                     <X className="h-5 w-5 text-gray-500" />
                  </button>
               </div>

               <nav className="flex-1 p-4 space-y-1">
                  {navItems.map((item) => {
                     const isActive = pathname === item.href;
                     const Icon = item.icon;
                     return (
                        <Link
                           key={item.href}
                           href={item.href}
                           className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                 ? "bg-indigo-50 text-indigo-700"
                                 : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                        >
                           <Icon className={`h-5 w-5 mr-3 ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
                           {item.label}
                        </Link>
                     );
                  })}
               </nav>

               <div className="p-4 border-t border-gray-100">
                  <button
                     onClick={handleLogout}
                     className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                     <LogOut className="h-5 w-5 mr-3" />
                     Sign Out
                  </button>
               </div>
            </div>
         </aside>

         {/* Main Content */}
         <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            {/* Top Header Mobile */}
            <header className="h-16 lg:hidden bg-white border-b border-gray-200 flex items-center px-4">
               <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
               >
                  <Menu className="h-6 w-6" />
               </button>
               <span className="ml-4 font-semibold text-gray-900">WebDPro AI</span>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-auto p-4 lg:p-8">
               {children}
            </main>
         </div>
      </div>
   );
}
