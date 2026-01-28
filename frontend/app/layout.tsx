import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavbarWrapper } from "./NavbarWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
   title: "WebdPro - AI-Powered Commerce Platform",
   description: "Generate, deploy, and manage your ecommerce website in minutes",
};

export default function RootLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return (
      <html lang="en">
         <head>
            <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
         </head>
         <body className={inter.className}>
            <NavbarWrapper />
            {children}
         </body>
      </html>
   );
}
