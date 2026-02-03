"use client";

import { useState, useEffect } from "react";
import { LogOut, User, Building2, CreditCard, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { logout, getUser } from "@/lib/auth";

interface UserProfile {
   name: string;
   email: string;
   phone: string;
   role: string;
   tenant_id: string;
}

export function ProfileMenu() {
   const [user, setUser] = useState<UserProfile | null>(null);
   const [isOpen, setIsOpen] = useState(false);
   const router = useRouter();

   useEffect(() => {
      // Load user from local storage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
         try {
            setUser(JSON.parse(storedUser));
         } catch (e) {
            console.error("Failed to parse user data", e);
         }
      }
   }, []);

   const handleLogout = () => {
      // Use the centralized logout function that clears all session data
      logout();
   };

   if (!user) return null;

   return (
      <div className="relative">
         <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-all group"
         >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
               {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="text-left hidden md:block">
               <p className="text-sm font-semibold text-gray-700 leading-none group-hover:text-indigo-600 transition-colors">
                  {user.name || "User"}
               </p>
               <p className="text-[10px] text-gray-500 font-medium">
                  {user.role === 'BUSINESS_OWNER' ? 'Merchant' : 'Customer'}
               </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
         </button>

         {isOpen && (
            <>
               <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
               <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-4">
                     {/* Header */}
                     <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                           <User className="w-6 h-6" />
                        </div>
                        <div>
                           <h4 className="font-bold text-gray-900 line-clamp-1">{user.name}</h4>
                           <p className="text-xs text-gray-500 line-clamp-1">{user.email || user.phone}</p>
                        </div>
                     </div>

                     {/* Details */}
                     <div className="space-y-2">
                        <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                           <Building2 className="w-4 h-4 text-gray-500" />
                           <div className="flex-1">
                              <p className="text-xs text-gray-500">Tenant ID</p>
                              <p className="text-xs font-mono font-medium text-gray-700 truncate">{user.tenant_id || "N/A"}</p>
                           </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                           <CreditCard className="w-4 h-4 text-gray-500" />
                           <div className="flex-1">
                              <p className="text-xs text-gray-500">Razorpay Status</p>
                              <div className="flex items-center gap-1.5">
                                 <AlertCircle className="w-3 h-3 text-amber-500" />
                                 <p className="text-xs font-medium text-amber-600">Not Connected</p>
                              </div>
                           </div>
                           <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                              Connect
                           </button>
                        </div>
                     </div>

                     {/* Actions */}
                     <div className="pt-2 border-t border-gray-100">
                        <button
                           onClick={handleLogout}
                           className="w-full flex items-center justify-center gap-2 p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
                        >
                           <LogOut className="w-4 h-4" />
                           Sign Out
                        </button>
                     </div>
                  </div>
               </div>
            </>
         )}
      </div>
   );
}
