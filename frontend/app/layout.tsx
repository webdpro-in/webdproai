import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
   title: "WebdPro - AI-Powered Commerce Platform",
   description: "Generate, deploy, and manage your ecommerce website in minutes",
};

import Script from "next/script";

export default function RootLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return (
      <html lang="en">
         <body className={inter.className}>
            <Navbar />
            {children}
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
         </body>
      </html>
   );
}
