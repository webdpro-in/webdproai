"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PromoCodeBarrier from "@/components/auth/PromoCodeBarrier";
import {
   LayoutDashboard,
   Store,
   ShoppingBag,
   Package,
   Settings,
   LogOut,
   Menu,
   X,
   Building2,
   CreditCard,
   AlertCircle
} from "lucide-react";

interface UserProfile {
   name: string;
   email: string;
   phone: string;
   role: string;
   tenant_id: string;
}

export default function DashboardLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   const router = useRouter();
   const pathname = usePathname();
   const [isSidebarOpen, setSidebarOpen] = useState(true);
   const [user, setUser] = useState<UserProfile | null>(null);

   // Promo Code State
   const [isPromoVerified, setIsPromoVerified] = useState(false);
   const [checked, setChecked] = useState(false);

   useEffect(() => {
      // Check promo code status
      const verified = localStorage.getItem("promo_verified") === "true";
      setIsPromoVerified(verified);
      setChecked(true);

      // Basic Auth Check
      const token = localStorage.getItem("token");
      if (!token) {
         router.push("/login");
      }

      // Load user profile
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
         try {
            setUser(JSON.parse(storedUser));
         } catch (e) {
            console.error("Failed to parse user data", e);
         }
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
      localStorage.removeItem("promo_verified"); // Clear promo access on logout
      router.push("/login");
   };

   // Prevent flash of content
   if (!checked) return null;

   // Show barrier if not verified
   if (!isPromoVerified && checked) {
      return <PromoCodeBarrier onSuccess={() => setIsPromoVerified(true)} />;
   }

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

               <div className="p-4 border-t border-gray-100 space-y-3">
                  {/* Tenant Info */}
                  {user && (
                     <div className="space-y-2">
                        <div className="p-3 bg-gray-50 rounded-lg">
                           <div className="flex items-center gap-2 mb-1">
                              <Building2 className="w-3.5 h-3.5 text-gray-500" />
                              <p className="text-xs text-gray-500 font-medium">Tenant ID</p>
                           </div>
                           <p className="text-xs font-mono font-medium text-gray-700 truncate pl-5">
                              {user.tenant_id || "N/A"}
                           </p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                           <div className="flex items-center gap-2 mb-1">
                              <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                              <p className="text-xs text-gray-500 font-medium">Razorpay Status</p>
                           </div>
                           <div className="flex items-center justify-between pl-5">
                              <div className="flex items-center gap-1.5">
                                 <AlertCircle className="w-3 h-3 text-amber-500" />
                                 <p className="text-xs font-medium text-amber-600">Not Connected</p>
                              </div>
                              <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                                 Connect
                              </button>
                           </div>
                        </div>
                     </div>
                  )}

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
