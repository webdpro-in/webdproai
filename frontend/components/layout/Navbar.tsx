"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ProfileMenu } from "./ProfileMenu";
import { Menu, X } from "lucide-react";

export function Navbar() {
   const pathname = usePathname();
   const isDashboard = pathname?.startsWith("/dashboard");
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      return () => window.removeEventListener("storage", handleStorageChange);
   }, []);

   return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
         <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
               <Image
                  src="/webdpro-logo.png"
                  alt="Webdpro Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg object-contain"
               />
               <span className="text-2xl font-bold tracking-tight text-gray-900">Webdpro</span>
            </Link>

            {/* Desktop Navigation - Hidden on Dashboard */}
            {!isDashboard && (
               <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                  <Link href="/features" className="hover:text-indigo-600 transition-colors">Features</Link>
                  {/* Showcase removed as requested */}
               </div>
            )}

            <div className="flex items-center gap-4">
               {/* Auth / Profile Area */}
               <div className="hidden md:flex items-center gap-4">
                  {isLoggedIn && isDashboard ? (
                     <ProfileMenu />
                  ) : !isLoggedIn && !isDashboard ? ( // Only show Login on marketing pages if not logged in
                     <>
                        <Link href="/login">
                           <Button variant="ghost" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">Login</Button>
                        </Link>
                        <Button variant="premium" className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-lg" size="sm">
                           Get Started
                        </Button>
                     </>
                  ) : isLoggedIn && !isDashboard ? (
                     // Logged in but on Landing -> Show Dashboard Button instead of Profile
                     <Link href="/dashboard">
                        <Button variant="premium" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-lg" size="sm">
                           Go to Dashboard
                        </Button>
                     </Link>
                  ) : null}
               </div>

               {/* Mobile Menu Toggle - Only on Marketing Site */}
               {!isDashboard && (
                  <button
                     className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                     onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                     {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
               )}
            </div>
         </div>

         {/* Mobile Menu Dropdown - Only on Marketing Site */}
         {isMobileMenuOpen && !isDashboard && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg py-4 px-6 animate-in slide-in-from-top-2">
               <div className="flex flex-col space-y-4">
                  <Link
                     href="/features"
                     className="text-gray-600 font-medium py-2 hover:text-indigo-600"
                     onClick={() => setIsMobileMenuOpen(false)}
                  >
                     Features
                  </Link>
                  <hr className="border-gray-100" />
                  {isLoggedIn ? (
                     <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="premium" className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-lg" size="sm">
                           Go to Dashboard
                        </Button>
                     </Link>
                  ) : (
                     <div className="flex flex-col gap-3 pt-2">
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                           <Button variant="ghost" className="w-full justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">Login</Button>
                        </Link>
                        <Button variant="premium" className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-lg" size="sm">
                           Get Started
                        </Button>
                     </div>
                  )}
               </div>
            </div>
         )}
      </nav>
   );
}
