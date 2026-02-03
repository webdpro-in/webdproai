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
   AlertCircle,
   Bell,
   BookOpen,
   Bookmark,
   Puzzle,
   HelpCircle,
   ChevronDown,
   ChevronRight,
   User
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
   const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
   const [user, setUser] = useState<UserProfile | null>(null);
   const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

   // Check if we're in the editor - hide dashboard UI
   const isEditorRoute = pathname?.includes('/editor/')

   // Promo Code State
   const [isPromoVerified, setIsPromoVerified] = useState(false);
   const [checked, setChecked] = useState(false);

   // Toggle dropdown
   const toggleDropdown = (name: string) => {
      setOpenDropdowns(prev =>
         prev.includes(name)
            ? prev.filter(item => item !== name)
            : [...prev, name]
      );
   };

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
      { label: "Resources", href: "/dashboard/resources", icon: BookOpen },
      {
         label: "Bookmarks",
         icon: Bookmark,
         dropdown: [
            { label: "Saved Items", href: "/dashboard/bookmarks/saved" },
            { label: "Collections", href: "/dashboard/bookmarks/collections" },
            { label: "Recent", href: "/dashboard/bookmarks/recent" }
         ]
      },
      { label: "Extensions", href: "/dashboard/extensions", icon: Puzzle },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Support", href: "/dashboard/support", icon: HelpCircle },
   ];

   const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("promo_verified");
      localStorage.removeItem("user");
      router.push("/login");
   };

   // Prevent flash of content
   if (!checked) return null;

   // Show barrier if not verified
   if (!isPromoVerified && checked) {
      return <PromoCodeBarrier onSuccess={() => setIsPromoVerified(true)} />;
   }

   // Editor route - full screen, no dashboard UI
   if (isEditorRoute) {
      return <div className="min-h-screen">{children}</div>
   }

   return (
      <div className="min-h-screen bg-gray-50 flex font-[family-name:var(--font-poppins)]">
         {/* Sidebar */}
         <aside
            className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
               } ${isSidebarCollapsed ? 'w-20' : 'w-72'
               } lg:translate-x-0 shadow-lg dashboard-sidebar`}
         >
            <div className="h-full flex flex-col">
               {/* Logo/Brand */}
               <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                  {!isSidebarCollapsed && (
                     <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                        Webdpro
                     </span>
                  )}
                  <button
                     onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                     className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 hidden lg:block"
                  >
                     {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                  <button
                     className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 lg:hidden"
                     onClick={() => setSidebarOpen(false)}
                  >
                     <X className="h-5 w-5" />
                  </button>
               </div>

               {/* User Profile Section */}
               {user && (
                  <div className={`p-4 border-b border-gray-200 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
                     {isSidebarCollapsed ? (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-semibold">
                           {user.name?.charAt(0) || 'U'}
                        </div>
                     ) : (
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-semibold">
                              {user.name?.charAt(0) || 'U'}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                           </div>
                        </div>
                     )}
                  </div>
               )}

               {/* Navigation */}
               <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                     const isActive = pathname === item.href;
                     const Icon = item.icon;
                     const hasDropdown = item.dropdown && item.dropdown.length > 0;
                     const isDropdownOpen = openDropdowns.includes(item.label);

                     return (
                        <div key={item.label}>
                           {hasDropdown ? (
                              <button
                                 onClick={() => toggleDropdown(item.label)}
                                 className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all ${isActive
                                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                              >
                                 <div className="flex items-center gap-3">
                                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
                                    {!isSidebarCollapsed && <span>{item.label}</span>}
                                 </div>
                                 {!isSidebarCollapsed && (
                                    <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                 )}
                              </button>
                           ) : (
                              <Link
                                 href={item.href || '#'}
                                 className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all ${isActive
                                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                              >
                                 <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
                                 {!isSidebarCollapsed && <span className="ml-3">{item.label}</span>}
                              </Link>
                           )}

                           {/* Dropdown Menu */}
                           {hasDropdown && isDropdownOpen && !isSidebarCollapsed && (
                              <div className="ml-8 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                 {item.dropdown?.map((subItem) => (
                                    <Link
                                       key={subItem.href}
                                       href={subItem.href}
                                       className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                       {subItem.label}
                                    </Link>
                                 ))}
                              </div>
                           )}
                        </div>
                     );
                  })}
               </nav>

               {/* Upgrade Plan */}
               <div className="p-3 border-t border-gray-200">
                  <Link
                     href="/dashboard/pricing"
                     className={`flex items-center w-full px-3 py-3 text-sm font-medium text-[#4285F4] rounded-lg hover:bg-blue-50 transition-all ${isSidebarCollapsed ? 'justify-center' : ''
                        }`}
                  >
                     <CreditCard className="h-5 w-5 shrink-0" />
                     {!isSidebarCollapsed && <span className="ml-3 font-bold">Upgrade Plan</span>}
                  </Link>
               </div>
            </div>
         </aside>

         {/* Mobile Overlay */}
         {isSidebarOpen && (
            <div
               className="fixed inset-0 bg-black/50 z-40 lg:hidden"
               onClick={() => setSidebarOpen(false)}
            />
         )}

         {/* Main Content */}
         <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
            }`}>
            {/* Mobile Header */}
            <header className="h-16 lg:hidden bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-30">
               <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
               >
                  <Menu className="h-6 w-6" />
               </button>
               <span className="ml-4 font-semibold text-gray-900">Webdpro</span>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-auto p-4 lg:p-8">
               {children}
            </main>
         </div>
      </div>
   );
}
