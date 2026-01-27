"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProfileMenu } from "./ProfileMenu";

export function Navbar() {
   const [isLoggedIn, setIsLoggedIn] = useState(false);

   useEffect(() => {
      // Check if user is logged in
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);

      // Listen for storage events (logout from other tabs) and custom events
      const handleStorageChange = () => {
         const currentToken = localStorage.getItem("token");
         setIsLoggedIn(!!currentToken);
      };

      window.addEventListener("storage", handleStorageChange);
      // Optional: Add a custom event listener if we dispatch one on login/logout
      return () => window.removeEventListener("storage", handleStorageChange);
   }, []);

   return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
         <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
               <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md">
                  <span className="font-bold text-lg">W</span>
               </div>
               <span className="text-xl font-bold tracking-tight text-gray-900">WebDPro</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
               <Link href="/features" className="hover:text-indigo-600 transition-colors">Features</Link>
               <Link href="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
               <Link href="/showcase" className="hover:text-indigo-600 transition-colors">Showcase</Link>
            </div>

            <div className="flex items-center gap-4">
               {isLoggedIn ? (
                  <ProfileMenu />
               ) : (
                  <>
                     <Link href="/login">
                        <Button variant="ghost" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">Login</Button>
                     </Link>
                     <Button variant="premium" className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-lg" size="sm">
                        Get Started
                     </Button>
                  </>
               )}
            </div>
         </div>
      </nav>
   );
}
