"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { usePathname } from "next/navigation";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   const pathname = usePathname();
   const isDashboard = pathname?.startsWith("/dashboard");

   return (
      <html lang="en">
         <body className={inter.className}>
            {!isDashboard && <Navbar />}
            {children}
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
         </body>
      </html>
   );
}
