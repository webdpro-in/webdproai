"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

export function NavbarWrapper() {
   const pathname = usePathname();
   
   // Hide navbar on authenticated pages (dashboard, login, generate, etc.)
   const hideNavbar = pathname?.startsWith('/dashboard') || 
                      pathname?.startsWith('/login') || 
                      pathname?.startsWith('/generate') ||
                      pathname?.startsWith('/auth');
   
   if (hideNavbar) return null;
   
   return <Navbar />;
}
